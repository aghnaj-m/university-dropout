let table;
let rootData;

const STYLES = {
  // Course IDs
  "33": { col: [230, 230, 250], label: "Biofuel" },
  "171": { col: [210, 240, 210], label: "Animation" },
  "8014": { col: [255, 220, 220], label: "Social" },
  "9003": { col: [255, 250, 200], label: "Agronomy" },
  "9070": { col: [230, 230, 230], label: "Design" },
  "9085": { col: [200, 230, 255], label: "Vet" },
  "9119": { col: [255, 200, 255], label: "Informatics" },
  "9130": { col: [255, 230, 200], label: "Equinc" },
  "9147": { col: [200, 255, 230], label: "Manage" },
  "9238": { col: [240, 240, 240], label: "Social S." },
  "9254": { col: [255, 240, 240], label: "Tourism" },
  "9500": { col: [240, 255, 240], label: "Nursing" },
  "9556": { col: [240, 240, 255], label: "Oral H." },
  "9670": { col: [255, 255, 220], label: "Advert" },
  "9773": { col: [220, 255, 255], label: "Journal" },
  "9853": { col: [255, 220, 240], label: "Basic Ed" },
  "9991": { col: [230, 255, 200], label: "Public" },

  // Generic Statuses (Shared by S1 and S2)
  "PASSED": { col: [76, 175, 80], label: "Passed this semester" },
  "NO_SHOW": { col: [200, 200, 200], label: "No Show" },

  // Specific Fail Statuses
  "S1_FAIL": { col: [255, 235, 59], label: "S1 Failed" }, // Yellow
  "S2_FAIL": { col: [255, 152, 0], label: "S2 Failed" }, // Orange

  // Final Target
  "Graduate": { col: [76, 175, 80, 120], label: "Graduate" }, // Distinct Blue
  "Enrolled": { col: [255, 235, 59, 120], label: "Enrolled - Didn't finish" }, // Light Salmon
  "Dropout": { col: [200, 200, 200, 120], label: "Dropout" }     // Red
};

let selectedCourse = null;
let legendHitboxes = [];
let courseSuccessCounts = {};
let hoveredNode = null;

function preload() {
  table = loadTable('p5-data.csv', 'csv', 'header');
}

function setup() {
  createCanvas(1200, 900);
  // noLoop(); // Remove noLoop so we can redraw on click
  angleMode(DEGREES);
  textAlign(CENTER, CENTER);

  calculateStats(table);
  rootData = processData(table);
}

function calculateStats(table) {
  courseSuccessCounts = {};
  for (let r = 0; r < table.getRowCount(); r++) {
    let row = table.getRow(r);
    let course = row.get('Course');
    let target = row.get('Target');

    // Ensure entry exists
    if (!courseSuccessCounts[course]) courseSuccessCounts[course] = 0;

    if (target === 'Graduate') {
      courseSuccessCounts[course]++;
    }
  }
}

function draw() {
  background(240);
  hoveredNode = null; // Reset per frame

  push();
  // Shift slightly left to leave space for the legend on the right
  translate(width / 2 - 120, height / 2);

  if (rootData && rootData.children.length > 0) {
    let total = rootData.children.reduce((acc, c) => acc + c.val, 0);
    drawSunburst(rootData, 0, 360, total, -1);
  } else {
    fill(0); textSize(20); noStroke();
    text("No Data Found", 0, 0);
  }

  // Draw overlay if hovered
  if (hoveredNode) {
    drawTooltip(hoveredNode);
  }

  pop();

  // Clear hitboxes each frame
  legendHitboxes = [];
  drawLegend(width - 250, 50);
}

function mousePressed() {
  // Check collision with legend items
  for (let box of legendHitboxes) {
    if (mouseX >= box.x && mouseX <= box.x + box.w &&
      mouseY >= box.y && mouseY <= box.y + box.h) {

      // Toggle selection
      if (selectedCourse === box.key) {
        selectedCourse = null; // Deselect
      } else {
        selectedCourse = box.key; // Select
      }

      // Refresh data
      rootData = processData(table);
      return;
    }
  }
}

function processData(table) {
  let hierarchy = {
    children: [], failed_units: [],
    grades: [], ages: [], genders: [], scholarships: [], debtors: [], tuition_fees: []
  };

  function findOrCreate(parentArray, id) {
    let found = parentArray.find(c => c.id === id);
    if (!found) {
      found = {
        id: id,
        val: 0,
        children: [],
        failed_units: [],
        grades: [],     // Admission grade
        ages: [],       // Age at enrollment
        genders: [],    // 1 vs 0
        scholarships: [],
        debtors: [],
        tuition_fees: [] // Tuition fees up to date
      };
      parentArray.push(found);
    }
    return found;
  }

  for (let r = 0; r < table.getRowCount(); r++) {
    let row = table.getRow(r);

    let course = row.get('Course');

    // Filter if a course is selected
    if (selectedCourse && course !== selectedCourse) continue;

    let target = row.get('Target');

    // Read numeric values safely
    // S1
    let s1_enrolled = float(String(row.get('Curricular_units_1st_sem_(enrolled)')));
    let s1_evals = float(String(row.get('Curricular_units_1st_sem_(evaluations)')));
    let s1_approved = float(String(row.get('Curricular_units_1st_sem_(approved)')));

    // S2
    let s2_enrolled = float(String(row.get('Curricular_units_2nd_sem_(enrolled)')));
    let s2_evals = float(String(row.get('Curricular_units_2nd_sem_(evaluations)')));
    let s2_approved = float(String(row.get('Curricular_units_2nd_sem_(approved)')));

    // Extended Stats
    let grade = float(String(row.get('Admission_grade')));
    let age = float(String(row.get('Age_at_enrollment')));
    let gender = float(String(row.get('Gender')));
    let scholarship = float(String(row.get('Scholarship_older')));
    let debtor = float(String(row.get('Debtor')));
    let tuition = float(String(row.get('Tuition_fees_up_to_date')));

    if (!course) continue;

    // Logic S1
    let s1_status;
    if (s1_enrolled === 0 || s1_evals === 0) {
      s1_status = "NO_SHOW";
    } else if (s1_approved >= s1_enrolled) {
      s1_status = "PASSED";
    } else {
      s1_status = "S1_FAIL";
    }

    // Logic S2
    let s2_status;
    if (s2_enrolled === 0 || s2_evals === 0) {
      s2_status = "NO_SHOW";
    } else if (s2_approved >= s2_enrolled) {
      s2_status = "PASSED";
    } else {
      s2_status = "S2_FAIL";
    }

    // Failed Units Calculation (Total for student)
    let failures = (s1_enrolled - s1_approved) + (s2_enrolled - s2_approved);
    if (failures < 0) failures = 0; // Should not happen with valid data

    // Helper to push data to node
    function updateNode(n) {
      n.val++;
      n.failed_units.push(failures);
      n.grades.push(grade);
      n.ages.push(age);
      n.genders.push(gender);
      n.scholarships.push(scholarship);
      n.debtors.push(debtor);
      n.tuition_fees.push(tuition);
    }

    // Build Tree
    // Push stats to every node in the path
    let courseNode = findOrCreate(hierarchy.children, course);
    updateNode(courseNode);

    let s1Node = findOrCreate(courseNode.children, s1_status);
    updateNode(s1Node);

    let s2Node = findOrCreate(s1Node.children, s2_status);
    updateNode(s2Node);

    let targetNode = findOrCreate(s2Node.children, target);
    updateNode(targetNode);
  }

  return hierarchy;
}

function drawSunburst(node, start, end, totalVal, level) {
  // Check Mouse Hover
  // Mouse position relative to center (translated)
  let mx = mouseX - (width / 2 - 120);
  let my = mouseY - (height / 2);
  let d = dist(0, 0, mx, my);
  let a = atan2(my, mx); // -180 to 180
  if (a < 0) a += 360; // 0 to 360

  if (level >= 0) {
    let style = STYLES[node.id] || { col: [150, 150, 150], label: node.id };

    let baseStep = 60;
    let rIn = level * baseStep + 50;

    // Add gap for the last circle (Target, level 3)
    if (level === 3) {
      rIn += 15; // Gap of 15px
    }

    // Make the last ring thinner (20px) vs others (60px)
    let thickness = (level === 3) ? 20 : baseStep;
    let rOut = rIn + thickness;

    // Check if hovered
    let isHovered = (d >= rIn && d <= rOut && a >= start && a <= end);
    if (isHovered) {
      hoveredNode = node;
      // visual feedback
      strokeWeight(3); stroke(50);
    } else {
      strokeWeight(1); stroke(255);
    }

    fill(style.col);
    beginShape();
    // Arc drawing
    for (let angle = start; angle <= end; angle += 0.5) vertex(cos(angle) * rOut, sin(angle) * rOut);
    for (let angle = end; angle >= start; angle -= 0.5) vertex(cos(angle) * rIn, sin(angle) * rIn);
    endShape(CLOSE);
  }

  if (node.children) {
    let currentStart = start;
    let parentVal = (level === -1) ? totalVal : node.val;
    for (let child of node.children) {
      // Proportional angle
      let angle = (child.val / parentVal) * (end - start);
      drawSunburst(child, currentStart, currentStart + angle, 0, level + 1);
      currentStart += angle;
    }
  }
}

function drawTooltip(node) {
  // Calculate stats
  let arr = node.failed_units;
  if (!arr || arr.length === 0) return;

  // Helper averages
  function getAvg(data) {
    if (!data || data.length === 0) return 0;
    return data.reduce((a, b) => a + b, 0) / data.length;
  }

  // Failures
  let avgFail = getAvg(node.failed_units);
  let sorted = [...node.failed_units].sort((a, b) => a - b);
  let mid = Math.floor(sorted.length / 2);
  let medianFail = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Extended Stats
  let avgGrade = getAvg(node.grades);
  let avgAge = getAvg(node.ages);
  let genderRat = getAvg(node.genders) * 100; // 1=Male, 0=Female
  let scholarPct = getAvg(node.scholarships) * 100;
  let debtorPct = getAvg(node.debtors) * 100;
  let tuitionPct = getAvg(node.tuition_fees) * 100;

  // Background box
  // Position relatively near mouse but readable
  let mx = mouseX - (width / 2 - 120);
  let my = mouseY - (height / 2);

  // Ensure tooltip is visible (simple clamp or offset)

  push();
  translate(mx, my);

  fill(255, 245);
  stroke(200);
  rect(15, 15, 250, 240, 8); // Increased size again for extra line

  fill(0); textAlign(LEFT, TOP); textSize(13); textStyle(BOLD);
  let title = STYLES[node.id] ? STYLES[node.id].label : node.id;
  text(title, 30, 30);

  textStyle(NORMAL); textSize(11);
  let ly = 55;
  let dy = 16;

  text(`Students: ${node.val}`, 30, ly); ly += dy;
  text(`Avg Failed Units: ${nf(avgFail, 1, 2)}`, 30, ly); ly += dy;
  text(`Median Failed Units: ${medianFail}`, 30, ly); ly += dy + 8; // spacer

  textStyle(BOLD); text("Group Profile:", 30, ly); ly += dy; textStyle(NORMAL);
  text(`Avg Admission Grade: ${nf(avgGrade, 1, 1)}`, 30, ly); ly += dy;
  text(`Avg Age at Enrollment: ${nf(avgAge, 1, 1)}`, 30, ly); ly += dy;

  // Financials
  text(`Scholarship Holders: ${nf(scholarPct, 1, 1)}%`, 30, ly); ly += dy;
  text(`Debtors: ${nf(debtorPct, 1, 1)}%`, 30, ly); ly += dy;
  text(`Tuition Up-to-Date: ${nf(tuitionPct, 1, 1)}%`, 30, ly); ly += dy;

  // Demographics
  text(`Gender: ${nf(genderRat, 1, 1)}% Male`, 30, ly);

  pop();
}

function drawLegend(x, y) {
  textAlign(LEFT, CENTER);

  function drawSection(title, keys, isInteractive) {
    if (keys.length === 0) return y;

    textStyle(BOLD); textSize(12); fill(50); noStroke();
    text(title, x, y);
    y += 20;

    textStyle(NORMAL); textSize(11);
    for (let k of keys) {
      if (STYLES[k]) {
        let s = STYLES[k];
        let count = courseSuccessCounts[k] || 0;

        // Highlight if selected
        let isSelected = (selectedCourse === k);
        let alpha = (selectedCourse && !isSelected && isInteractive) ? 100 : 255; // Fade others if one selected

        // Draw box
        stroke(180, alpha); strokeWeight(1);

        let c = color(s.col);
        c.setAlpha(alpha);
        fill(c);

        rect(x, y - 6, 12, 12);

        // Draw label
        noStroke();
        fill(0, alpha);

        if (isSelected) textStyle(BOLD);
        // Add count to label for visibility
        let labelText = s.label; // + " (" + count + ")"; 
        text(labelText, x + 20, y);
        if (isSelected) textStyle(NORMAL);

        // Store Hitbox if it's the interactive section
        if (isInteractive) {
          // Define approximate text width for hitbox
          let tw = textWidth(labelText) + 25;
          legendHitboxes.push({ key: k, x: x, y: y - 8, w: tw, h: 16 });
        }

        y += 18;
      }
    }
    y += 10;
    return y;
  }

  // 1. Gather all numeric Course IDs from STYLES
  let courseKeys = Object.keys(STYLES).filter(k => !isNaN(parseInt(k)));

  // Sort by success count descending
  courseKeys.sort((a, b) => (courseSuccessCounts[b] || 0) - (courseSuccessCounts[a] || 0));

  // 2. Semesters + No Show
  let semKeys = ["PASSED", "S1_FAIL", "S2_FAIL", "NO_SHOW"];

  // 3. Outcomes
  let outcomeKeys = ["Graduate", "Enrolled", "Dropout"];

  y = drawSection("COURSES (Sorted by Success)", courseKeys, true);
  y = drawSection("SEMESTERS", semKeys, false);
  y = drawSection("FINAL STATUS (End of the whole degree)", outcomeKeys, false);
}
