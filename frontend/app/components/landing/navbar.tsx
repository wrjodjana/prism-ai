export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-3">
      <div className="text-xl font-bold">Prism</div>
      <ul className="flex gap-4">
        <li>
          <a href="/about">About</a>
        </li>
        <li>
          <a href="/faq">FAQ</a>
        </li>
        <li>
          <a href="/features">Features</a>
        </li>
      </ul>
    </nav>
  );
}
