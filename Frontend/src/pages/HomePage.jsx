import { Link } from 'react-router-dom'

const STEPS = [
  { title: 'Report', body: 'Speak in Hindi, Punjabi or English — or type, or attach a photo.' },
  { title: 'Understand', body: 'Awaaz identifies the issue, its priority and the right department.' },
  { title: 'Route', body: 'Your complaint is routed to the responsible Chandigarh department.' },
  { title: 'Resolve', body: 'Track progress from Reported to Assigned to Resolved.' },
]

export default function HomePage() {
  return (
    <div>
      <section className="hero">
        <p className="tagline">AI that hears Chandigarh.</p>
        <h1>Speak. Report. Track.</h1>
        <p className="lead">
          Report civic problems using your voice, text or a photo. Awaaz understands the issue,
          routes it to the right department and helps you track it.
        </p>
        <div className="hero-ctas">
          <Link to="/report" className="btn btn-primary">Report a Problem</Link>
          <Link to="/track" className="btn btn-outline">Track Complaint</Link>
        </div>
        <p className="hero-cta-note">Works in Hindi, Punjabi and English · Available in Sectors 7, 17, 22, 35, 43 and 56</p>
      </section>

      <section aria-label="How Awaaz works">
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step" key={s.title}>
              <span className="step-num" aria-hidden="true">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
