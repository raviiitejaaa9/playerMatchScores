const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

module.exports = app;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started at port 3000");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayerTable = (anObject) => {
  return {
    playerId: anObject.player_id,
    playerName: anObject.player_name,
  };
};

const convertMatchTable = (anObject) => {
  return {
    matchId: anObject.match_id,
    match: anObject.match,
    year: anObject.year,
  };
};

//API_1 Returns a list of all the players in the player_details table

app.get("/players/", async (request, response) => {
  const sqlQuery = `
        SELECT *
        FROM player_details;`;

  const playersList = await db.all(sqlQuery);
  const convertedPlayersList = playersList.map((anObject) =>
    convertPlayerTable(anObject)
  );
  response.send(convertedPlayersList);
});

//API_2 Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  console.log(playerId);
  const sqlQuery = `
        SELECT *
        FROM player_details
        WHERE 
            player_id = ${playerId};`;

  const player = await db.get(sqlQuery);
  const convertedPlayer = convertPlayerTable(player);
  response.send(convertedPlayer);
});

//API_3 Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const sqlQuery = `
        UPDATE player_details
        SET player_name = '${playerName}'
        WHERE player_id = ${playerId};`;
  const updatedPlayer = await db.run(sqlQuery);
  response.send("Player Details Updated");
});

//API_4 Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  console.log(matchId);
  const sqlQuery = `
        SELECT *   
        FROM match_details
        WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(sqlQuery);
  const convertedMatchDetails = convertMatchTable(matchDetails);
  response.send(convertedMatchDetails);
});

//API_5 Returns a list of all the matches of a player
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  console.log(playerId);
  const sqlQuery = `
        SELECT 
            match_details.match_id,
            match_details.match,
            match_details.year   
        FROM 
            match_details LEFT JOIN  player_match_score
            ON player_match_score.match_id = match_details.match_id 
        WHERE 
            player_id = ${playerId} ;`;

  const matchDetails = await db.all(sqlQuery);
  const convertedMatchList = matchDetails.map((anObject) =>
    convertMatchTable(anObject)
  );

  response.send(convertedMatchList);
});

//API_6 Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  console.log(matchId);
  const sqlQuery = `
        SELECT 
            player_details.player_id,
            player_details.player_name   
        FROM 
            player_details LEFT JOIN  player_match_score
            ON player_match_score.player_id = player_details.player_id 
        WHERE 
            match_id = ${matchId} ;`;

  const playerDetails = await db.all(sqlQuery);
  const convertedPlayerList = playerDetails.map((anObject) =>
    convertPlayerTable(anObject)
  );

  response.send(convertedPlayerList);
});

//API_7  Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const sqlQuery = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM 
        player_details INNER JOIN player_match_score ON
        player_details.player_id = player_match_score.player_id
    WHERE 
        player_details.player_id = ${playerId};
    `;
  const reqDetails = await db.get(sqlQuery);
  response.send(reqDetails);
});
