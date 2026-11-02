export default function LoggedOut() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 480, padding: "2rem" }}>
      <h1>Logged out</h1>
      <p>The gate saw the session drop. Any tool call you try now gets refused until the next login.</p>
      <p><a href="/">Back home.</a></p>
    </main>
  );
}