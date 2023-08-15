const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//GET States API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`;
  const statesArray = await db.all(getStatesQuery);
  const updatedStatesArray = statesArray.map((stateObject) => {
    const updatedStateObject = {
      stateId: stateObject.state_id,
      stateName: stateObject.state_name,
      population: stateObject.population,
    };
    return updatedStateObject;
  });
  response.send(updatedStatesArray);
});

//GET State API
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  const updatedState = {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  };
  response.send(updatedState);
});

//ADD District API
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//GET District API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  const updatedDistrict = {
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  };
  response.send(updatedDistrict);
});

//DELETE District API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//UPDATE District API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `UPDATE district
    SET 
      district_name = '${districtName}',
      state_id = ${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
    WHERE 
      district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//GET State Stats API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const stateStatsQuery = `
  SELECT 
    SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
  FROM 
    district 
  WHERE 
    state_id = ${stateId};`;
  const stateStats = await db.get(stateStatsQuery);
  //   const updatedStateStatsQuery = {
  //     totalCases: stateStats.cases,
  //     totalCured: stateStats.cured,
  //     totalActive: stateStats.active,
  //     totalDeaths: stateStats.deaths,
  //   };
  response.send(stateStats);
});

//GET StateName Based on DistrictID API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `SELECT state_name AS stateName
    FROM 
      state INNER JOIN district
      ON state.state_id = district.state_id
    WHERE 
      district_id = ${districtId};`;
  const stateName = await db.get(getStateNameQuery);
  response.send(stateName);
});

//GET Districts API
app.get("/districts/", async (request, response) => {
  const getDistrictsArray = `SELECT * FROM district;`;
  const districtsArray = await db.all(getDistrictsArray);
  response.send(districtsArray);
});

module.exports = app;
