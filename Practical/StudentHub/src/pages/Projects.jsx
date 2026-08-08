import { useEffect, useState } from "react";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";

function Projects() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const githubUsername = "heertailor11"; // Replace with your GitHub username

  const fetchRepos = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://api.github.com/users/${githubUsername}/repos`
      );

      if (!response.ok) {
        throw new Error("Unable to fetch GitHub repositories.");
      }

      const data = await response.json();

      data.sort(
        (a, b) =>
          new Date(b.updated_at) - new Date(a.updated_at)
      );

      setRepos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  if (error)
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchRepos}
      />
    );

  return (
    <div className="container">

      <h1>My GitHub Projects</h1>

      <p className="subtitle">
        Here are some repositories from my GitHub profile.
      </p>

      <div className="search-box">
        <input
          type="text"
          placeholder="🔍 Search Repository..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="repo-grid">
        {filteredRepos.map((repo) => (
          <div className="repo-card" key={repo.id}>

            <h2>{repo.name}</h2>

            <p>
              {repo.description
                ? repo.description
                : "No description available."}
            </p>

            <div className="repo-info">

              <span>
                ⭐ {repo.stargazers_count}
              </span>

              <span>
                🍴 {repo.forks_count}
              </span>

              <span>
                💻 {repo.language || "N/A"}
              </span>

            </div>

            <a
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
            >
              View on GitHub →
            </a>

          </div>
        ))}
      </div>

    </div>
  );
}

export default Projects;