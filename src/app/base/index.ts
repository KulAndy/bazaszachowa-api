import MONGO_DB from "./mongo";
import MYSQL_BASE from "./mysql";

const BASE = {
  ...MYSQL_BASE,
  ...MONGO_DB,
};

export default BASE;
