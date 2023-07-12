with import <nixpkgs> {};

let
  corepack = stdenv.mkDerivation {
    name = "corepack";
    buildInputs = [ pkgs.nodejs-18_x ];
    phases = [ "installPhase" ];
    installPhase = ''
      mkdir -p $out/bin
      corepack enable --install-directory=$out/bin
    '';
  };
in 

stdenv.mkDerivation rec {
  name = "env";
  env = buildEnv { name = name; paths = buildInputs; };
  buildInputs = [ 
    corepack
  ];
}
