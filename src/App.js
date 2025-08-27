import logo from "./logo.svg";
import "./App.css";
import { useEffect, useState } from "react";
import { ADP } from "./data/adp";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import html2canvas from "html2canvas";

import {
  ADP_SUM_VALUES,
  MAX_VALUE_PER_ROUND,
  MAX_PLAYERS_PER_ROUND,
} from "./data/adpValues";

function App() {
  const IS_MOBILE = window.innerWidth < 820;

  const [loading, setLoading] = useState(false);
  const [adpData, setAdpData] = useState(ADP);
  const [stage, setStage] = useState(1);

  const [stagePlayers, setStagePlayers] = useState([]);
  const [usedPoints, setUsedPoints] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState([]);

  useEffect(() => {
    if (stage > 1) {
      setAdpData(
        ADP.filter(
          (player) => player.Rank > MAX_VALUE_PER_ROUND[`block_${stage - 1}`]
        )
      );
    } else {
      setAdpData(ADP);
    }
  }, [stage]);

  function handleOnChange(e, newValue, action, player) {
    let playerPoints = player?.option?.Rank;

    if (playerPoints > MAX_VALUE_PER_ROUND[`block_${stage}`])
      playerPoints = MAX_VALUE_PER_ROUND[`block_${stage}`];

    if (action === "selectOption") {
      if (selectedTeam.includes(player.option)) return;

      setUsedPoints(usedPoints + playerPoints);
    } else if (action === "removeOption") {
      setUsedPoints(usedPoints - playerPoints);
    } else if (action === "clear") {
      let newUsedPointsValue = usedPoints;

      stagePlayers.forEach((p) => {
        let points = p.Rank;

        if (points > MAX_VALUE_PER_ROUND[`block_${stage}`])
          points = MAX_VALUE_PER_ROUND[`block_${stage}`];

        newUsedPointsValue = newUsedPointsValue - points;
      });

      setUsedPoints(newUsedPointsValue);
    }

    setStagePlayers(newValue);
  }

  function handleConfirmStage() {
    setSelectedTeam([...selectedTeam, ...stagePlayers]);

    setUsedPoints(usedPoints - ADP_SUM_VALUES[`block_${stage}`]);
    setStage(stage + 1);
    setStagePlayers([]);
  }

  function handleResetTeam() {
    setStage(1);
    setStagePlayers([]);
    setUsedPoints(0);
    setSelectedTeam([]);
  }

  function handlePreviousRound() {
    if (stage == 2) {
      handleResetTeam();
    } else {
      let newSelectedTeam = selectedTeam.slice(
        0,
        -MAX_PLAYERS_PER_ROUND[`block_${stage - 1}`]
      );

      let previousPlayersSumRank = 0;
      newSelectedTeam.forEach((p) => {
        let points = p.Rank;

        if (points > MAX_VALUE_PER_ROUND[`block_${stage - 1}`])
          points = MAX_VALUE_PER_ROUND[`block_${stage - 1}`];

        previousPlayersSumRank += points;
      });

      let adpSumValues = 0;
      let adpStage = stage - 1;

      for (let i = 1; i < adpStage; i++) {
        adpSumValues += ADP_SUM_VALUES[`block_${i}`];
      }

      let newUsedPointsValue = previousPlayersSumRank - adpSumValues;

      setUsedPoints(newUsedPointsValue);

      setSelectedTeam(newSelectedTeam);

      setStagePlayers([]);
      setStage(stage - 1);
    }
  }

  function renderLineup() {
    const lineup = [
      "QB",
      "RB",
      "RB",
      "WR",
      "WR",
      "TE",
      "FLEX",
      "FLEX",
      "FLEX",
      "BENCH",
      "BENCH",
      "BENCH",
      "BENCH",
      "BENCH",
      "BENCH",
      "BENCH",
      "BENCH",
      "BENCH",
      "BENCH",
      "BENCH",
    ];

    let assignedPlayers = [];

    return (
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 500 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Player</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Bye</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lineup.map((position, i) => {
              let player = findPlayer(position, assignedPlayers);

              if (player) {
                assignedPlayers.push(player);
              }

              return (
                <TableRow key={i}>
                  <TableCell>{position}</TableCell>
                  <TableCell>{player?.Player}</TableCell>
                  <TableCell>{player?.Team}</TableCell>
                  <TableCell>{player?.Bye}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  function findPlayer(position, assignedPlayers) {
    let validPlayer = null;

    switch (position) {
      case "QB":
      case "WR":
      case "RB":
      case "TE":
        validPlayer = selectedTeam.find(
          (player) =>
            player.POS.includes(position) && !assignedPlayers.includes(player)
        );

        break;

      case "FLEX":
        validPlayer = selectedTeam.find(
          (player) =>
            !player.POS.includes("QB") && !assignedPlayers.includes(player)
        );
        break;

      case "BENCH":
        validPlayer = selectedTeam.find(
          (player) => !assignedPlayers.includes(player)
        );
        break;

      default:
        break;
    }

    return validPlayer;
  }

  function handleExport() {
    let table = document.getElementById("my-guys");

    if (table) {
      html2canvas(table).then(function (canvas) {
        const image = canvas.toDataURL("image/png");

        // Create a link and trigger download
        const link = document.createElement("a");
        link.href = image;
        link.download = "screenshot.png"; // file name
        link.click();
      });
    }
  }

  function renderByPosition() {
    let QB = 0;
    let WR = 0;
    let RB = 0;
    let TE = 0;

    selectedTeam.map((player) => {
      if (player.POS.includes("QB")) QB++;
      else if (player.POS.includes("WR")) WR++;
      else if (player.POS.includes("RB")) RB++;
      else if (player.POS.includes("TE")) TE++;
    });

    return (
      <>
        <div className="counter-box vLayout">
          <div className="counter-box-label">QB</div>
          <div className="counter-box-value">{QB}</div>
        </div>
        <div className="counter-box vLayout">
          <div className="counter-box-label">WR</div>
          <div className="counter-box-value">{WR}</div>
        </div>
        <div className="counter-box vLayout">
          <div className="counter-box-label">RB</div>
          <div className="counter-box-value">{RB}</div>
        </div>
        <div className="counter-box vLayout">
          <div className="counter-box-label">TE</div>
          <div className="counter-box-value">{TE}</div>
        </div>
      </>
    );
  }

  let label = "";

  if (stage === 1) {
    label = "Select 2 players for rounds 1 and 2";
  } else if (stage === 2) {
    label = "Select 4 players between rounds 3 and 6";
  } else if (stage === 3) {
    label = "Select 4 players between rounds 7 and 10";
  } else if (stage === 4) {
    label = "Select 4 players between rounds 11 and 14";
  } else if (stage === 5) {
    label = "Select 6 players between rounds 15 and 20";
  }

  return (
    <div className="MyGuys-wrapper vLayout">
      {stage < 6 ? (
        <div className="MyGuys-counter hLayout">
          <div className="counter-box vLayout">
            <div className="counter-box-label">Used Points</div>
            <div className="counter-box-value">{usedPoints}</div>
          </div>
          <div className="counter-box vLayout">
            <div className="counter-box-label">Minimum Points</div>
            <div className="counter-box-value">
              {ADP_SUM_VALUES[`block_${stage}`]}
            </div>
          </div>
          <div className="counter-box vLayout">
            <div className="counter-box-label">Points needed</div>
            <div className="counter-box-value">
              {ADP_SUM_VALUES[`block_${stage}`] - usedPoints}
            </div>
          </div>
        </div>
      ) : null}
      <div className="MyGuys-selector vLayout">
        {stage < 6 ? (
          <Autocomplete
            disabled={stage > 5}
            onChange={(e, newValue, action, player) => {
              handleOnChange(e, newValue, action, player);
            }}
            groupBy={(option) => {
              if (option.Rank <= MAX_VALUE_PER_ROUND.block_1)
                return "ADP Rounds 1 & 2";
              if (option.Rank <= MAX_VALUE_PER_ROUND.block_2)
                return "ADP Rounds 3 - 6";
              if (option.Rank <= MAX_VALUE_PER_ROUND.block_3)
                return "ADP Rounds 7 - 10";
              if (option.Rank <= MAX_VALUE_PER_ROUND.block_4)
                return "ADP Rounds 11 & 14";
              if (option.Rank <= MAX_VALUE_PER_ROUND.block_5)
                return "ADP Rounds 15 - 20";
              if (option.Rank > MAX_VALUE_PER_ROUND.block_5)
                return "ADP Rounds 21+";
            }}
            value={stagePlayers}
            multiple
            options={adpData.filter((o) => o.Team != "DST")}
            getOptionLabel={(option) =>
              `${option.Rank} - ${option.Player} (${option.POS}) - ${option.Team} - bye ${option.Bye}`
            }
            renderInput={(params) => <TextField {...params} label={label} />}
          />
        ) : null}

        {stage < 6 ? (
          <Button
            onClick={handleConfirmStage}
            className="MyGuys-confirm-button"
            variant="contained"
            disabled={
              usedPoints < ADP_SUM_VALUES[`block_${stage}`] ||
              stagePlayers.length != MAX_PLAYERS_PER_ROUND[`block_${stage}`]
            }
          >
            Confirm
          </Button>
        ) : (
          <Button
            className="MyGuys-confirm-button"
            variant="contained"
            onClick={handleExport}
          >
            Export
          </Button>
        )}
      </div>
      {selectedTeam.length ? (
        <>
          <div className="MyGuys-by-position hLayout">{renderByPosition()}</div>
          <div
            className={`MyGuys-show-players ${
              IS_MOBILE ? "vLayout" : "hLayout"
            }`}
          >
            <div className="MyGuys-selected-team vLayout">
              <div className="MyGuys-selected-team-lable">My Guys</div>
              <TableContainer
                sx={{ minWidth: 500 }}
                id="my-guys"
                component={Paper}
              >
                <Table aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>ADP</TableCell>
                      <TableCell>Player</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Team</TableCell>
                      <TableCell>Bye</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedTeam.map((row) => (
                      <TableRow
                        key={row.name}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell>{row.Rank}</TableCell>
                        <TableCell>{row.Player}</TableCell>
                        <TableCell>{row.POS}</TableCell>
                        <TableCell>{row.Team}</TableCell>
                        <TableCell>{row.Bye}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <div className="hLayout">
                <Button variant="contained" onClick={handleResetTeam}>
                  Reset team
                </Button>
                <Button
                  variant="outlined"
                  disabled={stage == 1}
                  onClick={handlePreviousRound}
                >
                  Previous round
                </Button>
              </div>
            </div>
            <div className="MyGuys-lineup vLayout">
              <div className="MyGuys-selected-team-lable">Lineup</div>

              {renderLineup()}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default App;
