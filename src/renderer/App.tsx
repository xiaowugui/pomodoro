import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useThemeStore } from './stores/themeStore'
import { useAppStore } from './stores/appStore'
import TimerPage from './pages/TimerPage'
import TasksPage from './pages/TasksPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import DailyViewPage from './pages/DailyViewPage'
import TaskNotesPage from './pages/TaskNotesPage'
import TaskNotePopup from './pages/TaskNotePopup'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const { initialize } = useThemeStore()
  const { loadAllData } = useAppStore()

  useEffect(() => {
    const init = async () => {
      await loadAllData()
      await initialize()
      setIsLoading(false)
    }
    init()
  }, [loadAllData, initialize])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/timer" replace />} />
      <Route path="/timer" element={<TimerPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/daily" element={<DailyViewPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/notes" element={<TaskNotesPage />} />
      <Route path="/note/:taskId" element={<TaskNotePopup />} />
    </Routes>
  )
}

export default App
