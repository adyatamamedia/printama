import { app } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { existsSync } from 'fs'

const TEMP_DIR_NAME = 'Printama'

export function getTempDirectory(): string {
  const systemTemp = app.getPath('temp')
  return join(systemTemp, TEMP_DIR_NAME)
}

export async function ensureTempDirectory(): Promise<string> {
  const tempDir = getTempDirectory()
  if (!existsSync(tempDir)) {
    await fs.mkdir(tempDir, { recursive: true })
  }
  return tempDir
}

export async function cleanTempFiles(): Promise<{ success: boolean; deletedCount: number }> {
  const tempDir = getTempDirectory()
  if (!existsSync(tempDir)) {
    return { success: true, deletedCount: 0 }
  }

  let count = 0
  try {
    const files = await fs.readdir(tempDir)
    for (const file of files) {
      try {
        const filePath = join(tempDir, file)
        const stat = await fs.stat(filePath)
        if (stat.isFile()) {
          await fs.unlink(filePath)
          count++
        }
      } catch {
        // Ignore single locked file
      }
    }
    return { success: true, deletedCount: count }
  } catch (err) {
    console.error('Error cleaning temp directory:', err)
    return { success: false, deletedCount: count }
  }
}
