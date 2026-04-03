import { useState , useEffect, use } from 'react'
import './App.css'

function App() {
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/exercises')
      .then(res => res.json())
      .then(data => setExercises(data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const submitLog = (id) => {
    fetch("http://127.0.0.1:5000/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        exercise_id: id,
        set1: formData[id]?.set1,
        set2: formData[id]?.set2,
        set3: formData[id]?.set3,
        duration: formData[id]?.duration
      })
    });
  };

  const [formData, setFormData] = useState({});

  const handleChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  return (
    <>
      {exercises.map(ex => (
        <div key={ex.id} className="card">
          <h2>{ex.name}</h2>

          <p>{ex.target_sets} sets × {ex.target_reps} reps</p>

          <video width="300" controls>
            <source src={ex.video_url} type="video/mp4" />
          </video>

          <input
            type="number"
            placeholder="set1"
            onChange={(e) => handleChange(ex.id, "set1", e.target.value)}
          />

          <input
            type="number"
            placeholder="set2"
            onChange={(e) => handleChange(ex.id, "set2", e.target.value)}
          />

          <input
            type="number"
            placeholder="set3"
            onChange={(e) => handleChange(ex.id, "set3", e.target.value)}
          />

          <input
            type="number"
            placeholder="Duration (sec)"
            onChange={(e) => handleChange(ex.id, "duration", e.target.value)}
          />

          <button onClick={() => submitLog(ex.id)}>Save</button>
        </div>
      ))}
    </>
  )
}

export default App