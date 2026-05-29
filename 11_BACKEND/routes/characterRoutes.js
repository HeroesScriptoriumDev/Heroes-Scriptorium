const express = require("express");
const router = express.Router();

const {
  createCharacter,
  getCharacters,
  getCharacterById,
  updateCharacter,
  softDeleteCharacter
} = require("../controllers/characterController");

router.post("/", createCharacter);
router.get("/", getCharacters);
router.get("/:id", getCharacterById);
router.patch("/:id", updateCharacter);
router.delete("/:id", softDeleteCharacter);

module.exports = router;