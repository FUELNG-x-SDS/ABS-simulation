# ABS-simulation

## To-do's
- [X] Add 3/4 more ship types for simulation + Upload image assets for different vessels.
- [X] Create side bar layout for statistics purposes.
- [X] "Current cycle" statistics: 1h = 1s in simulation time.
- [ ] Fix vessels/ships behaviours: have instances when they fail to function --> use the repair vessel and bring them to a repairing dock or something + add delays (1-3 kind of delays).
- [ ] Fix vessels/ships behaviours: randomly pick from a uniform distribution when their bunkering is done based on the range of propobabilities of ship capacity (TEU) and fuel required.
- [ ] Fix vessels/ships behaviours: add vessel capacity and refuel when needed.
- [ ] Fix vessels/ships behaviours: have a waiting queue/list in line.
- [ ] Deploy to cloud (if needed).

Proposed UI simulation workflow: 
<div style="text-align: center;">
    <img src="readme_assets/Plan_UI.png">
</div>

## Installation
### Download code
```shell
git clone https://github.com/FUELNG-x-SDS/ABS-simulation.git
cd ABS-simulation
```

### Python Environment Flask Setup
```shell
pip install Flask
python main.py
```

## About
Agent-based Simulation for FUELNG debunkering services.

<div style="text-align: center;">
    <img src="readme_assets/ABS_ver_1.gif">
</div>

<div style="text-align: center;">
    <img src="readme_assets/ABS_State_Diagram.png">
</div>
