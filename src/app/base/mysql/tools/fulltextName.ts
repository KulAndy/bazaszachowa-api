const fulltextName = (name: string) => {
  let nameFul = name.replaceAll(/['`-]/g, " ");
  if (nameFul.startsWith("'") || nameFul.startsWith("`")) {
    nameFul = nameFul.slice(1);
  }
  nameFul = nameFul.replaceAll(/[^\d\sa-z]/gi, "");
  nameFul = nameFul.replaceAll(/\b\w{1,2}\b/g, "");
  nameFul = nameFul.replaceAll(/\s+/g, " ");
  nameFul = nameFul.trim();
  nameFul = nameFul
    .split(" ")
    .filter(Boolean)
    .map((word) => "+" + word)
    .join(" ");
  return nameFul;
};

export default fulltextName;
