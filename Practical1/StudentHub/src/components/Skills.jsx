function Skills({ skillList }) {
  return (
    <section>
      <h2>Technical Skills</h2>

      <div className="skills-grid">
        {skillList.map((skill) => (
          <div key={skill} className="skill-card">
            {skill}
          </div>
        ))}
      </div>
    </section>
  );
}

export default Skills;