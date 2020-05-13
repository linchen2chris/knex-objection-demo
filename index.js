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

      scores: {
        relation: Model.HasManyRelation,
        modelClass: Score,
        join: {
          from: "persons.id",
          to: "scores.studentId",
        },
      },
    };
  }
}

class Score extends Model {
  static get tableName() {
    return "scores";
  }
}

async function createSchema() {
  if (await knex.schema.hasTable("scores")) {
    await knex.schema.dropTable("scores");
  }
  if (await knex.schema.hasTable("persons")) {
    await knex.schema.dropTable("persons");
  }

  await knex.schema.createTable("persons", (table) => {
    table.increments("id").primary();
    table.integer("parentId").references("persons.id");
    table.jsonb("details");
    table.string("firstName");
  });
  await knex.schema.createTable("scores", (table) => {
    table.increments("id").primary();
    table.integer("studentId").references("persons.id");
    table.string("key");
    table.integer("value");
  });
}

async function main() {
  const sylvester = await Person.query().insertGraph({
    firstName: "first",
    details: {
			firstName: "first",
			math: 89,
			english: 80,
    },
    // scores: [
    //   { key: "math", value: 80 },
    //   { key: "english", value: 90 },
    // ],
  });
  await Person.query().insertGraph({
    firstName: "second",
    details: {
			firstName: "SEcond",
			math: 88,
			english: 81
    },
    // scores: [
    //   { key: "math", value: 81 },
    //   { key: "english", value: 82 },
    // ],
  });

  // console.log("Line 61", sylvester);
  // const finduser = await Person.query()
  //   .select("persons.*", "children.firstName as childName")
  //   .innerJoin("persons as children", "children.parentId", "persons.id")
  //   .where("persons.firstName", "sylvester")
  //   .withGraphFetched("children")
  //   .orderBy("childName");

  // console.log("Line 64", finduser);

  // const sortByScore = await Person.query().where(knex.raw("firstName like '%sec%'")).orWhere("math", ">", 88).from(Person.query().select("firstName", {math: knex.raw("(details->>'math')")}).as("a"));
	const l = "%sec%";
  const sortByScore = await Person.query().select("firstName", {math: knex.raw("(details->>'math')::INT")}).whereRaw("lower((details->>'firstName')) like ?", [l]);


  // .groupBy("persons.id");
  // const sortByScore = await Person.relatedQuery("scores").for(1);
  // .intersect(Person.query().select("firstName", {mathScore: "scores.value"}).innerJoin("scores", "scores.studentId", "persons.id").where("scores.key", "math"));
  // const sortByScore = await Person.query()
  // 			.select().innerJoin("scores", "scores.studentId", "persons.id").withGraphFetched("scores").groupBy("persons.id");
  //
  // const sortByScore = await knex.raw("select persons.id, scores.value as math from persons inner join scores on persons.id = scores.studentid where socres.key = 'math'");
  console.log("Line 102", sortByScore);
}

createSchema()
  .then(() => main())
  .then(() => knex.destroy())
  .catch((err) => {
    console.error(err);
    return knex.destroy();
  });
