with import <nixpkgs> {};

let
  packages = with pkgs; [
    openssl_3
    pkg-config
  ];

  corepack = stdenv.mkDerivation {
    name = "corepack";
    buildInputs = [ pkgs.nodejs_18 ];
    phases = [ "installPhase" ];
    installPhase = ''
      mkdir -p $out/bin
      corepack enable --install-directory=$out/bin
    '';
  };
in pkgs.mkShell {
  buildInputs = packages ++ [ corepack ];

  shellHook = ''
    export LD_LIBRARY_PATH=${
      pkgs.lib.makeLibraryPath packages
    }:$LD_LIBRARY_PATH
  '';
}
