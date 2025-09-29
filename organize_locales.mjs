import { readFile, writeFile, readdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

function sortObjectKeys(unsortedObj) {
  return Object.keys(unsortedObj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = unsortedObj[key]
      return acc
    }, {})
}

async function main() {
  try {
    // Replicate __dirname functionality for ES Modules.
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    const localesDir = path.join(__dirname, "locales")
    const sourceLang = "en.json"
    const sourcePath = path.join(localesDir, sourceLang)

    console.log(`Processing source file: ${sourceLang}`)

    // 1. Load the source english file into memory.
    const sourceFileContent = await readFile(sourcePath, "utf8")
    const sourceJson = JSON.parse(sourceFileContent)

    // 2. Sort the loaded source json by its string keys.
    const sortedSourceJson = sortObjectKeys(sourceJson)
    const masterKeys = Object.keys(sortedSourceJson)

    // 5. Save the now-sorted source file.
    await writeFile(
      sourcePath,
      JSON.stringify(sortedSourceJson, null, 2),
      "utf8",
    )
    console.log(`✅ Successfully sorted and saved ${sourceLang}`)
    console.log("---")

    // 3. Find all other locale files.
    const allFiles = await readdir(localesDir)
    // Filter out the source file and any non-JSON files.
    const targetFiles = allFiles.filter(
      (file) => file.endsWith(".json") && file !== sourceLang,
    )

    // 4. Process each target file.
    for (const file of targetFiles) {
      const filePath = path.join(localesDir, file)
      const targetFileContent = await readFile(filePath, "utf8")
      const targetJson = JSON.parse(targetFileContent)

      const processedJson = {}

      // Iterate over the sorted keys from the source ('en.json') file.
      // This ensures all target files have the same key order and set of keys.
      for (const key of masterKeys) {
        // If the key exists in the target file, use its value.
        // Otherwise, fill the missing key with an empty string.
        processedJson[key] = targetJson.hasOwnProperty(key)
          ? targetJson[key]
          : ""
      }

      // 5. Save the processed file.
      await writeFile(filePath, JSON.stringify(processedJson, null, 2), "utf8")
      console.log(`✅ Synced, sorted, and saved ${file}`)
    }

    console.log("\n---")
    console.log("All locale files have been successfully organized!")
  } catch (error) {
    console.error(error)
  }
}

main()
