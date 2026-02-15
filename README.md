# Visualizing Academic Failure: Student Dropout Trajectories

## Project Overview
This project visualizes the academic paths of students to identify patterns leading to dropout. It uses a **Sunburst Chart** to represent the hierarchical relationship between Study Major, 1st Semester Performance, 2nd Semester Performance, and Final Outcome.

**Research Question:**
How do academic performance trajectories (passing vs. failing) in the first and second semesters influence the final outcome (Dropout vs. Enrollment) across different study majors?

## File Structure
* `index.html`: The main webpage containing the visualization and descriptions.
* `sketch.js`: The p5.js source code for the visualization logic.
* `style.css`: Styling for the webpage layout.
* `p5-data.csv`: The dataset used for the visualization.
* `p5.js` / `p5.sound.min.js`: Core libraries.

## How to Run (Local Server)
Due to browser security policies (CORS) regarding loading local CSV files, this project **must be run via a local web server**.

Using Python (Recommended)
Mac and Linux usually have Python pre-installed.

1.  Open your **Terminal**.
2.  Navigate to the project folder:
    ```bash
    cd /path/to/your/project/folder
    ```
    *(Tip: Type `cd ` and drag the folder into the terminal window).*
3.  Start the server:
    ```bash
    python3 -m http.server
    ```
4.  Open your web browser and go to:
    **[http://localhost:8000](http://localhost:8000)**
