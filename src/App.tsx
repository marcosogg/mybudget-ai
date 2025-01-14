import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import CreateTask from "@/pages/CreateTask";
import Tasks from "@/pages/Tasks";
import TaskDetails from "@/pages/TaskDetails";
import CreateEvent from "@/pages/CreateEvent";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/create" element={<CreateTask />} />
        <Route path="/tasks/:id" element={<TaskDetails />} />
        <Route path="/events/create" element={<CreateEvent />} />
      </Routes>
    </Router>
  );
}

export default App;