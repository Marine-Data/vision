export // Flèches de réordonnancement : pas de glisser-déposer, qui est pénible au
// doigt sur téléphone et inaccessible au clavier.
function Fleches({ onUp, onDown, nom }) {
  const st = {
    background: "none",
    border: 0,
    color: "var(--slate)",
    fontSize: 15,
    lineHeight: 1,
    padding: "4px 5px",
  };
  return (
    <span
      style={{
        flex: "0 0 auto",
        whiteSpace: "nowrap",
      }}
    >
      <button style={st} onClick={onUp} aria-label={"Monter " + (nom || "")} title="Monter">
        ↑
      </button>
      <button style={st} onClick={onDown} aria-label={"Descendre " + (nom || "")} title="Descendre">
        ↓
      </button>
    </span>
  );
}

// Une poche archivée sort de l'affichage mais reste comptée tant qu'elle a des
// postes actifs : archiver masque, ça ne solde pas — sinon ce serait une porte
// dérobée pour faire remonter l'épargne sans rien changer à la réalité.
