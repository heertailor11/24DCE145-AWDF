function Header({ name, themeColor }) {
  return (
    <header className="header">
      <h1 style={{ color: themeColor }}>
        Hi, I'm {name}
      </h1>

      <p className="subtitle">
        Computer Engineering Student | Frontend Developer | React Learner
      </p>
    </header>
  );
}

export default Header;