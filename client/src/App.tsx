import { BrowserRouter, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Add routes here */}
        <Route path="/" element={<div className="p-8 text-2xl font-bold">SkillBridge 🚀</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
