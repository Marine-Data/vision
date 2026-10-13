import React from "react";

export class GardeErreur extends React.Component {
  constructor(e) {
    super(e),
      (this.state = {
        err: null,
      });
  }
  static getDerivedStateFromError(e) {
    return {
      err: e,
    };
  }
  render() {
    return this.state.err
      ? React.createElement(
          "pre",
          {
            style: {
              padding: 16,
              whiteSpace: "pre-wrap",
              font: "12px/1.5 monospace",
              color: "#dd5f43",
              background: "#fbfcfb",
            },
          },
          `⚠️ Erreur d'affichage

` + (this.state.err.stack || this.state.err.message || String(this.state.err)),
        )
      : this.props.children;
  }
}
