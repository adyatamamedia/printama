import { app } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { existsSync } from 'fs'
import { UserPreferences } from '../../shared/types'
import { DEFAULT_USER_PREFERENCES } from '../../shared/constants/presets'

function getSettingsFilePath(): string {
  return join(app.getPath('userData'), 'printama_preferences.json')
}

export async function loadPreferences(): Promise<UserPreferences> {
  const filePath = getSettingsFilePath()
  if (!existsSync(filePath)) {
    return DEFAULT_USER_PREFERENCES
  }

  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_USER_PREFERENCES, ...parsed }
  } catch (err) {
    console.error('Error reading preferences file:', err)
    return DEFAULT_USER_PREFERENCES
  }
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const current = await loadPreferences()
  const updated = { ...current, ...prefs }
  const filePath = getSettingsFilePath()

  try {
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8')
    return updated
  } catch (err) {
    console.error('Error saving preferences file:', err)
    return current
  }
}
