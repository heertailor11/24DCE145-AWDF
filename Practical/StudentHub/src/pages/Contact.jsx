import { useState } from "react";

function Contact() {

  const [message, setMessage] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="container">

      <h1>Contact Me</h1>

      <input
        type="text"
        placeholder="Enter your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <p>Character Count : {message.length}</p>

      <button onClick={() => setShowHelp(!showHelp)}>
        {showHelp ? "Hide Help" : "Show Help"}
      </button>

      {showHelp && (
        <div className="help">
          Enter your message and submit it.
        </div>
      )}

    </div>
  );
}

export default Contact;