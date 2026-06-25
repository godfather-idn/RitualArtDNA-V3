import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RitualArtworkRegistryModule =
  buildModule(
    "RitualArtworkRegistryModule",
    (m) => {

      const registry =
        m.contract(
          "RitualArtworkRegistry"
        );

      return {
        registry,
      };
    }
  );

export default
  RitualArtworkRegistryModule;