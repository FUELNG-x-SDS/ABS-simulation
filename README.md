# ABS-simulation

## To-do's
- [ ] Upload image assets for different vessels.
- [ ] Create side bar layout.
- [ ] "Current cycle" statistics: 1h = 1s in simulation time.
- [ ] Add 3/4 more ship types for simulation.
- [ ] Fix vessels/ships behaviours: have instances when they fail to function, randomly pick from a uniform distribution when their bunkering is done.
- [ ] Have a button to increase, decrease, reset capabilities.
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