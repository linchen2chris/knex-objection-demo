const { Model, ref } = require("objection");
const Knex = require("knex");

const knex = Knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "admin",
    password: "admin",
    database: "testdb",
  },
});

Model.knex(knex);

class Person extends Model {
  static get tableName() {
    return "persons";
  }

  static get relationMappings() {
    return {
      children: {
        relation: Model.HasManyRelation,
        modelClass: Person,
        join: {
          from: "persons.id",
          to: "persons.parentId",
        },
      },
    };
  }
}

async function createSchema() {
  if (await knex.schema.hasTable("persons")) {
    await knex.schema.dropTable("persons");
  }

  await knex.schema.createTable("persons", (table) => {
    table.increments("id").primary();
    table.integer("parentId").references("persons.id");
    table.jsonb("details");
    table.string("firstName");
  });
}

async function main() {
  const sylvester = await Person.query().insertGraph({
    firstName: "sylvester",
    details: {
      gender: "M",
      age: 12,
    },
    children: { firstName: "saga" },
  });
  await Person.query().insertGraph({
    firstName: "sylvester",
    details: {
      gender: "M",
      age: 10,
    },
    children: { firstName: "laga" },
  });

  console.log("Line 61", sylvester);
  const finduser = await Person.query().select("children.firstName as childName")
	innerJoin()
    .where("firstName", "sylvester")
    .withGraphFetched("children");
  // .orderByRaw("details.");

  console.log("Line 64", finduser);
}

createSchema()
  .then(() => main())
  .then(() => knex.destroy())
  .catch((err) => {
    console.error(err);
    return knex.destroy();
  });
