// class StructuralView {
//
//     /**
//      * DAG that we want to show
//      * @type {DAG}
//      */
//     static DAG = null;
//
//     /**
//      * The order of the features.
//      * @type {[Feature]}
//      */
//     static featureOrder = [];
//     static depthDAG = 0;
//     static heightDAG = 0;
//
//     /**
//      * Store the color of each outcome value
//      * @type {Map<String, String>}
//      */
//     static outcomeColors = new Map();
//
//     /**
//      * The unique labels that are present in the DAG.
//      * @type {[string]}
//      */
//     static differentLabels = [];
//
//     static possibleColors = {
//         blue: "#1F77B4",
//         orange: "#FF7F0E",
//         green: "#2CA02C",
//         red: "#D62728",
//         purple: "#9467BD",
//         brown: "#8C564B",
//         pink: "#E377C2",
//         gray: "#7F7F7F",
//         olive: "#BCBD22",
//         cyan: "#17BECF"
//     }
//
//     /**
//      * Keeping track of nodes that are (or should be) drawn.
//      * @type {[DrawnNode]}
//      */
//     drawnNodes = []
//
//     /**
//      * The offset from the top to use for a bar (and not for drawing the graph)
//      * @type {number}
//      */
//     yOffset = 100;
//
//     /**
//      * The offset from the left where we don't draw.
//      * @type {number}
//      */
//     xOffset = 0;
//
//     // Coordinates of selector square
//     selectorSquare = {x: 0, y: 0, width: 250, height: 150};
//     selectorSquareDrawn = false;
//     previousMousePress = false;
//
//     constructor(p) {
//         this._p = null;
//         this.p = p;
//     }
//
//     get setup() {
//         let self = this;
//
//         return function () {
//             let canvas = self.p.createCanvas(self.p.windowWidth / 3, self.p.windowHeight * 3/4);
//             canvas.background(255);
//             canvas.position(0, 0);
//
//             // We're using rectmode radius (because we want to draw from the radius
//             self.p.rectMode(self.p.RADIUS);
//
//             self.drawBorder();
//             self.drawDecisionBorder();
//         }
//     }
//
//     get draw() {
//         let self = this;
//         return function () {
//             // Don't draw the DAG if there is nothing
//             if (!StructuralView.DAG) {
//                 return;
//             }
//
//             self.p.noStroke();
//             self.p.noFill();
//             let color = self.p.color(255, 255);
//             self.p.background(color);
//
//             self.drawBorder();
//             self.drawDecisionBorder();
//
//             // First calculate where nodes are.
//             self.calculateNodePositions();
//
//             // Then draw the nodes
//             self.drawNodesAndEdges();
//
//             // Try to draw the selector square
//             self.drawSelectorSquare();
//
//         }
//     }
//
//     /**
//      * This method will draw the selector square. It is used by the draw() method to detect whenever the mouse is pressed.
//      */
//     drawSelectorSquare() {
//         if (this.p.mouseIsPressed) {
//             // Draw the selector square
//             this.selectorSquareDrawn = true;
//
//             // If the previous mouse press was false, we know that the user just started clicking
//             if (this.previousMousePress === false) {
//                 // Set the first click as a starting point
//                 this.selectorSquare.x = this.p.mouseX;
//                 this.selectorSquare.y = this.p.mouseY;
//             }
//
//             // Set width and height based on distance from starting point to your mouse
//             this.selectorSquare.width = this.p.mouseX - this.selectorSquare.x ;
//             this.selectorSquare.height = this.p.mouseY - this.selectorSquare.y;
//
//             // The previous mouse press can now be set to true
//             this.previousMousePress = true;
//         } else {
//             // Previous mouse press was false.
//             this.previousMousePress = false;
//         }
//
//         // Now draw selector field (if needed)
//         if (this.selectorSquareDrawn) {
//             // Let's draw the selector field
//
//             let color = this.p.color("#fcba03");
//
//             color.setAlpha(15);
//
//             this.p.push();
//             this.p.fill(color);
//             this.p.stroke("#fcba03");
//             this.p.strokeWeight(3);
//             this.p.rectMode(this.p.CORNER);
//             this.p.rect(this.selectorSquare.x, this.selectorSquare.y,
//                 this.selectorSquare.width, this.selectorSquare.height);
//             this.p.pop();
//         }
//     }
//
//     /**
//      * Draw the nodes and edges between the nodes. This method assumes that the positions of the nodes are already calculated
//      * using a function like {@link calculateNodePositions}.
//      */
//     drawNodesAndEdges() {
//         // Loop over all nodes we need to draw
//         for (let drawnNode of this.drawnNodes) {
//
//             // Check if this is a decision node
//             if (drawnNode.nodeData.isLabelNode()) {
//                 // Draw a square instead of a circle
//                 // Lookup the color of this outcome node
//                 let color = this.getColorOfOutcomeValue(drawnNode.nodeData.value);
//
//                 if (color !== null) {
//                     this.p.fill(color);
//                 }
//
//                 this.p.stroke(0);
//                 this.p.square(drawnNode.x, drawnNode.y, drawnNode.width / 2);
//             } else {
//                 // Else, we're drawing a circle because it's a normal node.
//                 this.p.fill(0);
//                 this.p.stroke(0);
//                 this.p.circle(drawnNode.x, drawnNode.y, drawnNode.width);
//             }
//
//             // Next draw the edges between the nodes.
//
//             // Check if we have a 'true' edge.
//             if (drawnNode.nodeData.true_node !== null) {
//                 // Try to draw a line from this node to the true node
//                 // Grab next node
//                 let closeNode = this.drawnNodes.find(node => node.nodeData === drawnNode.nodeData.true_node);
//
//                 // If we cannot find the next node, let's skip it.
//                 if (closeNode === undefined || closeNode === null) {
//                     continue;
//                 }
//                 this.p.stroke(0);
//
//                 // Draw a curve between the current node and the next node.
//                 this.p.line(drawnNode.x, drawnNode.y, closeNode.x, closeNode.y);
//
//                 // Draw a triangle to signal an arrowhead - it faces rightwards!
//                 // Size of arrow is scaled by the size of the nodes, and 10 (such that they are not too large if nodes are large).
//                 this.p.triangle(closeNode.x - closeNode.width / 2, drawnNode.y,
//                     closeNode.x - closeNode.width / 2 - Math.min(closeNode.width/2, 10), drawnNode.y + Math.min(closeNode.width/2, 10),
//                     closeNode.x - closeNode.width / 2 - Math.min(closeNode.width/2, 10), drawnNode.y - Math.min(closeNode.width/2, 10));
//
//             }
//
//             // Check if we have a 'false' edge.
//             if (drawnNode.nodeData.false_node !== null) {
//                 // Try to draw a line from this node to the false node
//                 // Grab next node
//                 let closeNode = this.drawnNodes.find(node => node.nodeData === drawnNode.nodeData.false_node);
//
//                 // If we cannot find the next node, let's skip it.
//                 if (closeNode === undefined || closeNode === null) {
//                     continue;
//                 }
//
//                 if (drawnNode.x < closeNode.x) {
//                     // We're going to a node that's on the right of the currently drawn node
//                     // This means that we have to draw a line straight down (to the Y line of the next node)
//                     // and then draw a line from there to the next node.
//                     // this.p.stroke("#2cb30e");
//                     this.p.line(drawnNode.x, drawnNode.y, drawnNode.x, closeNode.y); // Draw line straight down
//                     this.p.line(drawnNode.x, closeNode.y, closeNode.x, closeNode.y); // Draw horizontal line to the next node.
//
//                     // Draw a triangle to signal an arrowhead - it faces rightwards!
//                     this.p.triangle(closeNode.x - closeNode.width / 2, closeNode.y,
//                         closeNode.x - closeNode.width / 2 - Math.min(closeNode.width/2, 10), closeNode.y + Math.min(closeNode.width/2, 10),
//                         closeNode.x - closeNode.width / 2 - Math.min(closeNode.width/2, 10), closeNode.y - Math.min(closeNode.width/2, 10));
//
//                 } else if (drawnNode.x > closeNode.x) {
//                     // We're going to a node that's on the left of the currently drawn node.
//                     // We want to draw line halfway between the two nodes.
//                     // this.p.stroke("#b50d6c");
//
//                     // Determine the distance (on the y-axis) between the two nodes.
//                     let yDistance = Math.abs(closeNode.y - drawnNode.y);
//
//                     // Draw a line halfway down.
//                     this.p.line(drawnNode.x, drawnNode.y, drawnNode.x, drawnNode.y + (yDistance / 2));
//                     // Draw line to the left.
//                     this.p.line(drawnNode.x, drawnNode.y + (yDistance / 2), closeNode.x, drawnNode.y + (yDistance / 2));
//                     // Draw line down to the next node.
//                     this.p.line(closeNode.x, drawnNode.y + (yDistance / 2), closeNode.x, closeNode.y);
//
//                     // Draw a triangle to signal an arrowhead - it faces downwards!
//                     this.p.triangle(closeNode.x, closeNode.y - closeNode.width / 2,
//                         closeNode.x - Math.min(closeNode.width/2, 10), closeNode.y - closeNode.width / 2 - Math.min(closeNode.width/2, 10),
//                         closeNode.x + Math.min(closeNode.width/2, 10), closeNode.y - closeNode.width / 2 - Math.min(closeNode.width/2, 10));
//                 } else {
//
//                     // Draw a line straight down.
//                     this.p.line(drawnNode.x, drawnNode.y, closeNode.x, closeNode.y);
//
//                     // Draw a triangle to signal an arrowhead
//                     this.p.triangle(closeNode.x, closeNode.y - closeNode.width / 2,
//                         closeNode.x - Math.min(closeNode.width/2, 10), closeNode.y - closeNode.width / 2 - Math.min(closeNode.width/2, 10),
//                         closeNode.x + Math.min(closeNode.width/2, 10), closeNode.y - closeNode.width / 2 - Math.min(closeNode.width/2, 10));
//                 }
//
//             }
//         }
//     }
//
//     /**
//      * This method calculates the positions of the nodes based on the available features. It draws the labels at the top
//      * for each attribute and generates {DrawnNode} instances that signal where each node has to be drawn.
//      */
//     calculateNodePositions() {
//
//         // Clear all drawn nodes
//         this.drawnNodes.length = 0;
//
//         // Get the unique number of labels we have, but
//         let numberOfLabels = StructuralView.featureOrder.length;
//         // The space per feature (based on the number of labels).
//         let featureWidth = this.getCanvasWidth() / numberOfLabels;
//         // The height per feature (based on the number of rules of the DAG).
//         let featureHeight = this.getCanvasHeight() / (StructuralView.heightDAG);
//
//         let featureSpace = [];
//
//         // Determine the width of a column for each attribute and draw the label of that attribute on top.
//         for (let index = 0; index < numberOfLabels; index++) {
//             let x = featureWidth + featureWidth * index;
//
//             let feature = StructuralView.featureOrder[index]
//             featureSpace.push({feature: feature, xStart: x - featureWidth, xEnd: x});
//
//             this.p.push();
//             // Draw the names of the features on top
//             // Make label feature bold
//             this.p.strokeWeight(feature.isLabel ? 1 : 0);
//             this.p.textSize(20);
//             this.p.textAlign(this.p.CENTER);
//             // P5 works a bit weird with rotations. Objects rotate with respect to the origin
//             // This means that I have to place the text on the origin, rotate it and then translate it to where I want it to go.
//             this.p.translate(x - featureWidth / 2, this.yOffset / 2);
//             this.p.rotate(-this.p.HALF_PI/2);
//             this.p.text(feature.name, 0, 0);
//             this.p.pop();
//
//         }
//
//         // The node should fit in the width and height of the feature space.
//         // Hence, we take the minimum value of these two.
//         let sizeOfNode = Math.min(featureWidth / 2, featureHeight / 2);
//
//         // We start at y = the offset + the middle of the first row.
//         let y = this.yOffset + featureHeight / 2;
//
//         // Determine the locations of the nodes.
//         for (let node of StructuralView.DAG.getNodes()) {
//
//             // Find the dimensions of this feature
//             let dimensions = featureSpace.find(space => space.feature.name === node.feature.name)
//
//             // We couldn't find any dimensions!
//             if (dimensions === undefined) {
//                 continue;
//             }
//
//             let isLabelNode = node.isLabelNode();
//
//             let width = dimensions.xEnd - dimensions.xStart;
//
//             // Put node here.
//             this.drawnNodes.push(new DrawnNode(node, dimensions.xStart + width / 2, y,
//                 sizeOfNode));
//
//             // We reached a decision node, so we increase the Y spacing (because we're on a new line).
//             if (isLabelNode) {
//                 // Increase the y by another row.
//                 y += featureHeight;
//             }
//
//         }
//     }
//
//     drawBorder() {
//         this.p.stroke("#C59EAE");
//         this.p.strokeWeight(4);
//         this.p.rect(0, 0, this.p.width, this.p.height);
//
//         // Draw horizontal bar below text
//         this.p.fill(0);
//         this.p.stroke(0);
//         this.p.strokeWeight(1);
//         this.p.line(0, this.yOffset, this.p.width, this.yOffset);
//
//     }
//
//     /**
//      * Draw area when decision nodes are shown
//      */
//     drawDecisionBorder() {
//         // Draw vertical border for decision nodes
//         // this.p.stroke(0);
//         // this.p.strokeWeight(1);
//         // this.p.line(this.p.width - this.xOffset,
//         //     this.yOffset, this.p.width - this.xOffset, this.p.height);
//     }
//
//     getCanvasWidth() {
//         return this.p.width;
//     }
//
//     getCanvasHeight() {
//         return this.p.height - this.yOffset;
//     }
//
//     get p() {
//         return this._p;
//     }
//
//     set p(original) {
//         this._p = original;
//         this._p.draw = this.draw;
//         this._p.setup = this.setup;
//     }
//
//     /**
//      * Set the DAG of the structural view.
//      * @param dag
//      */
//     static setDagData(dag) {
//         StructuralView.DAG = dag
//         StructuralView.depthDAG = dag.getDepth();
//         StructuralView.heightDAG = dag.getHeight();
//
//         let seenLabels = [];
//
//         // Find all different labels that are used
//         for (let node of dag.getNodes()) {
//             // We haven't seen this label before
//             if (seenLabels.indexOf(node.feature.name) === -1) {
//                 seenLabels.push(node.feature.name);
//             }
//         }
//
//         // Record the unique labels in this DAG.
//         StructuralView.differentLabels = seenLabels;
//
//         console.log(`Loaded DAG into structural view!`)
//     }
//
//     /**
//      * Get the index (zero-based) of the name of the feature in the current feature ordering
//      * @param featureName Name of the feature to search
//      * @return The index of the feature in the feature ordering. Will return -1 if the feature is not found!
//      */
//     getFeatureIndex(featureName) {
//         let index = 0;
//         for (let feature of StructuralView.featureOrder) {
//             if (feature.name === featureName) {
//                 return index;
//             }
//
//             index++;
//         }
//
//         return -1;
//     }
//
//     /**
//      * Get the color (for the decision nodes) that is assigned to the given outcome value.
//      * @param {string} outcome The value to get the color for.
//      * @return {?string} color (in hex) or null if no color was found
//      */
//     getColorOfOutcomeValue(outcome) {
//
//         let color = StructuralView.outcomeColors.get(outcome);
//
//         if (color === undefined) {
//             return null;
//         }
//
//         return color;
//     }
//
//     /**
//      * Set the order of the features
//      * @param {[Feature]} featureOrder A list of features, ordered in the way they should appear.
//      */
//     static setFeatureOrder(featureOrder) {
//         StructuralView.featureOrder = featureOrder.filter(feature => StructuralView.differentLabels.includes(feature.name));
//
//         StructuralView.outcomeColors.clear();
//
//         this.assignColorsToOutcomes();
//     }
//
//     /**
//      * Try to assign unique color to each outcome. It uses the #featureOrder variable to determine the label that has the outcome values.
//      */
//     static assignColorsToOutcomes() {
//         // Find the feature that is the outcome feature
//         let outcomeFeature = StructuralView.featureOrder.find(feature => feature.isLabel);
//
//         if (outcomeFeature !== undefined) {
//             let index = 0;
//             // Loop over the feature that has the outcomes and assign a color to each outcome value
//             for (let value of outcomeFeature.values) {
//                 StructuralView.outcomeColors.get(value] =Object.keys(StructuralView.possibleColors)[index];
//                 index++;
//             }
//         }
//     }
// }

rulesViewWidth = 4 / 6;
controlViewWidth = 1 / 6;
filterViewWidth = 1 / 6;

class RulesView {

    /**
     * The offset from top. This is where the attributes appear.
     * @type {number}
     */
    yOffset = 40;

    /**
     * The margin that should be kept from the left and right border. This is single-sided, meaning that we lose
     * 2 * xMargin pixels.
     * @type {number}
     */
    xMargin = 10;

    /**
     * Keep track of which attrributes are clicked.
     * @type {Map<Feature, Boolean>}
     */
    static clickedFeatures = new Map();

    /**
     * The order of the features.
     * @type {[Feature]}
     */
    static featureOrder = [];

    /**
     * The rules that might be shown
     * @type {Rules}
     */
    static rules = null;


    /**
     * Store the color of each outcome value
     * @type {Map<String, String>}
     */
    static outcomeColors = new Map();

    /**
     * Possible colors that we can use for the outcome value.
     * @type {{orange: string, red: string, pink: string, green: string, gray: string, blue: string, olive: string, purple: string, brown: string, cyan: string}}
     */
    static possibleColors = {
        blue: "#1F77B4",
        orange: "#FF7F0E",
        green: "#2CA02C",
        red: "#D62728",
        purple: "#9467BD",
        brown: "#8C564B",
        pink: "#E377C2",
        gray: "#7F7F7F",
        olive: "#BCBD22",
        cyan: "#17BECF"
    }

    static attributeColumnHeight = 40;
    static attributeColumnWidth = 40

    constructor(p) {
        this._p = null;
        this.p = p;
    }

    get setup() {
        let self = this;

        return function () {
            // We draw an initial canvas.
            let canvas = self.p.createCanvas(self.p.windowWidth * rulesViewWidth, self.p.windowHeight);
            canvas.background(144);
            canvas.position(self.p.windowWidth * controlViewWidth, 0);

            self.drawBorder();
            self.p.rectMode(self.p.CENTER);
        }
    }

    get draw() {
        let self = this;
        return function () {
            //have hand on clickable items
            // feature are clickable
            if (self.p.mouseY < self.yOffset + RulesView.attributeColumnHeight && self.p.mouseY > self.yOffset){
                let index_feature = Math.floor((self.p.mouseX-self.xMargin)/RulesView.attributeColumnWidth);
                if (index_feature > 0 && index_feature < RulesView.featureOrder.length){
                    self.p.cursor('hand');
                }else{
                    self.p.cursor('default');
                }
            } else {
                self.p.cursor('default');
            }

            self.p.background(255);

            self.p.text("Rules view", self.p.width / 2, 30);

            // Don't draw anything if we have no features.
            if (RulesView.featureOrder.length === 0) {
                return;
            }

            // Draw attribute labels.
            self.drawFeatureLabels();

            // Stop drawing if there are no rules.
            if (RulesView.rules == null) {
                return;
            }

            // We can draw the rules now.
            self.drawRules();

        }
    }

    get mouse_clicked(){
        let self = this;
        return function(){
            if (self.p.mouseY < self.yOffset + RulesView.attributeColumnHeight && self.p.mouseY > self.yOffset){
                console.log(self.p.mouseY);

                let index_feature = Math.floor((self.p.mouseX-self.xMargin)/RulesView.attributeColumnWidth);
                if (index_feature > 0 && index_feature < RulesView.featureOrder.length){
                    let feature = RulesView.featureOrder[index_feature-1];
                    let clicked = RulesView.clickedFeatures.get(feature);
                    RulesView.clickedFeatures.set(feature, !clicked);
                }
            }

        }
    }

    drawBorder() {
        this.p.stroke("#FFC114");
        this.p.strokeWeight(4);
        this.p.rect(0, 0, this.p.width, this.p.height);

        // Draw title of structural view
        this.p.noStroke();
        this.p.textSize(32);
        this.p.textAlign(this.p.CENTER);
        this.p.text("Rules view", this.p.width / 2, 30);
    }

    get p() {
        return this._p;
    }

    set p(original) {
        this._p = original;
        this._p.draw = this.draw;
        this._p.setup = this.setup;
        this._p.mouseClicked=this.mouse_clicked;
    }

    /**
     * This method draws the columns for the attributes.
     */
    drawFeatureLabels() {
        let offset = 1;
        // Determine the width of a column
        let widthPerLabel = (this.p.width - 2 * this.xMargin) / (RulesView.featureOrder.length+.5); //also draw incoming edges
        // Set a fixed height for the columns
        RulesView.attributeColumnHeight = this.p.height/25;
        let heightPerLabel = RulesView.attributeColumnHeight;

        let index = 0;

        // Create new temporary style
        this.p.push();

        this.p.stroke(200);
        this.p.strokeWeight(0.5);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.textSize(Math.min(25, heightPerLabel/2));

        // For all features, draw a box
        for (let feature of RulesView.featureOrder) {
            if (feature.name === "label"){ //do not draw the label
                continue;
            }

            if (index > 0){ // do not draw first line
                let x = this.xMargin + ((index+offset) * widthPerLabel); //set off by one for incoming edge
                let y = this.yOffset;
                let yEnd = this.yOffset + this.p.height;

                // Draw column for label
                this.p.line(x, y, x, yEnd);
            }

            this.p.push();

            let x = this.xMargin + ((index+offset) * widthPerLabel) + 10; //set off by one for incoming edge
            let y = this.yOffset + heightPerLabel/2;


            //show icon to indicate attribute is selected
            if (RulesView.clickedFeatures.get(feature)){
                this.p.stroke(0, 92, 71);
                this.p.strokeWeight(2);
                this.p.fill(255);
                this.p.triangle(x-5, y-5, x+5, y-5, x, y+5);
            }
            this.p.strokeWeight(0);
            this.p.fill(0);
            x = this.xMargin + ((index+offset) * widthPerLabel) + widthPerLabel/2; //set off by one for incoming edge

            // Now draw feature name in the attribute box
            this.p.text(feature.name, x, y);
            this.p.pop();

            index++;
        }

        // Remove temporary style.
        this.p.pop();
    }

    /**
     * Draw the rules according to the filters that are applied.
     */
    drawRules() {
        let offset = 1;
        // Determine the width of a column
        let columnWidth = (this.p.width - 2 * this.xMargin) / (RulesView.featureOrder.length + 0.5); //leave room for incoming edge
        RulesView.attributeColumnWidth = columnWidth;
        // Set a fixed height for the columns
        let columnHeight = (this.p.height - 2*this.yOffset - RulesView.attributeColumnHeight)
            / Math.min(RulesView.rules.rules.length, 30);

        // Set the first y to be at the bottom of the first row.
        let y = this.yOffset + RulesView.attributeColumnHeight + columnHeight;

        // Generate a temp style
        this.p.push();
        this.p.textAlign(this.p.LEFT, this.p.BOTTOM);
        this.p.textSize(Math.min(15, columnHeight*3/5));

        let ruleIndex = 0;
        var filtered_rules = RulesView.rules.rules;
        let support_lim = FilterView.support_val;
        let confidence_lim = FilterView.conf_val;
        let number_of_not_shown_rules = 0;

        if( support_lim != 0 || confidence_lim != 0){
            if(support_lim != 0){
                filtered_rules = RulesView.filterRulesByVal(filtered_rules,{ support: support_lim});
            }
            if(confidence_lim != 0){
                filtered_rules = RulesView.filterRulesByVal(filtered_rules,{ confidence: confidence_lim});
            }
        }

        // For each rule, draw a row.
        loop1:
            for (let rule of filtered_rules) {
                let tp = rule.truePositives;
                let fp = rule.falsePositives;
                let ratio = tp/(tp+fp);
                //check if we should draw rule according to mouse clicks
                for (let [feature, clicked] of RulesView.clickedFeatures.entries()){
                    if (clicked){
                        if (!rule.conditions.has(feature)){
                            let x = this.xMargin + columnWidth + number_of_not_shown_rules*15;
                            let color = this.p.color(RulesView.outcomeColors.get(rule.label));
                            color.setAlpha(100);
                            this.p.fill(color);

                            this.p.strokeWeight(0);
                            number_of_not_shown_rules += 1;
                            this.p.circle(x, y, 10); //draw circle for decision node
                            continue loop1; //continue to the next rule
                        }
                    }
                }

                // only draw top 30 rules
                if (ruleIndex > 29){
                    let x = this.xMargin + columnWidth + number_of_not_shown_rules*15;
                    let color = this.p.color(RulesView.outcomeColors.get(rule.label));

                    color.setAlpha(100);
                    this.p.fill(color);

                    this.p.strokeWeight(0);
                    number_of_not_shown_rules += 1;
                    this.p.circle(x, y, 10); //draw circle for decision node
                    continue; //continue to the next rule
                }

                if (number_of_not_shown_rules > 0){
                    number_of_not_shown_rules = 0;
                    y += columnHeight;
                }

                // Calculate the start of the line
                let xStart = this.xMargin + .4*columnWidth;
                // And the end of the line
                let xEnd = this.p.width - this.xMargin - 1/4*columnWidth;

                //set the color of the line according to the label
                this.p.stroke(RulesView.outcomeColors.get(rule.label));

                // Draw the line
                this.p.strokeWeight(1);
                this.p.line(xStart, y, xEnd, y);

                // Draw values of conditions
                for (let [feature, value] of rule.conditions.entries()) {
                    this.p.strokeWeight(0); // we want no stroke on the text or circle
                    let featureIndex = RulesView.featureOrder.indexOf(feature); //get location of feature

                    let x = this.xMargin + (featureIndex+offset)*columnWidth + columnWidth/10; //set off by a half (since incoming edge)
                    this.p.fill(RulesView.outcomeColors.get(rule.label)); //set fill color of circle
                    this.p.circle(x, y, 10); //draw circle for decision node
                    this.p.fill(50); // set text color
                    this.p.text(value, x+5, y-2 ); //draw the text
                }

                //Draw the incoming cases
                let tempX = this.xMargin; //set start value of X for incoming case distribution
                let totalWidth = .95*columnWidth; // this is the space we have
                let remainingWidth = 1; // keep track of percentage of data not satisfied by rules
                for (const [label, color] of RulesView.outcomeColors.entries()){
                    let percentageWidth=0;
                    if (label === rule.label){ //are true positives
                        percentageWidth = rule.truePositives/RulesView.determineNumberOfCases(); //Determine percentage TODO for multiple labels
                    } else{
                        percentageWidth = rule.falsePositives/RulesView.determineNumberOfCases(); //TODO for multiple labels
                    }
                    this.p.fill(color);  //set the fill of the label
                    this.p.rect(tempX + (percentageWidth*totalWidth)/2 , y, percentageWidth*totalWidth, columnHeight*.8); // draw rectangle
                    tempX += percentageWidth*totalWidth; //determine new locations
                    remainingWidth -= percentageWidth;
                }

                //draw rectangle for non-satisfied data
                this.p.fill(230);
                this.p.rect(tempX + (remainingWidth*totalWidth)/2, y, remainingWidth*totalWidth, columnHeight*.8);

                // draw small rectangle on the left to indicate start of rule
                let x = this.xMargin + .95*columnWidth;
                this.p.strokeWeight(1);
                this.p.stroke(150);
                this.p.fill(255);
                this.p.rect(x, y, 5, columnHeight/2 + 5, 2);

                // Draw the outcome label
                let featureIndex = RulesView.featureOrder.length - 1;
                x = this.xMargin + (featureIndex+offset)*columnWidth + columnWidth/4; //set off by .5
                let height = 0.8*columnHeight;
                let width = 0.8*columnWidth/2;
                // for squircles, we need to draw the background first with the smallest area (determined by ratio)
                if (ratio > 0.5){
                    this.p.fill(255); // set fill color of rectangle //draw false positives
                } else {
                    this.p.fill(RulesView.outcomeColors.get(rule.label)); // set fill color true positives // true postives
                }
                this.p.stroke(RulesView.outcomeColors.get(rule.label)); //set stroke color of rectangle
                this.p.strokeWeight(1); //make sure stroke is drawn
                this.p.rect(x, y, width, height, 20);

                // draw true positives
                this.p.push();
                this.p.rectMode(this.p.CORNER);

                // draw correct squircles and right line to the right side
                // for squircles, we draw the foreground with the largest area (determined by ratio)
                if (ratio > 0.5){
                    let tempX = x - width/2; //set x to correct x for CORNER
                    let tempWidth = width * tp/(tp+fp); //find relative part of width
                    let tempY = y - height/2;
                    this.p.fill(RulesView.outcomeColors.get(rule.label));
                    if (ratio < .85){
                        this.p.rect(tempX, tempY, tempWidth, height, 20, 0, 0, 20);
                    } else if (ratio < 0.90){
                        this.p.rect(tempX, tempY, tempWidth, height, 20, 5, 5, 20);
                    } else if (ratio < .95){
                        this.p.rect(tempX, tempY, tempWidth, height, 20, 10, 10, 20);
                    } else {
                        this.p.rect(tempX, tempY, tempWidth, height, 20);
                    }
                } else { // draw negatives (due to squircles)
                    let tempX = x - width/2 + width * tp/(tp+fp); //set x to correct x for CORNER
                    let tempWidth = width * (1-tp/(tp+fp)); //find relative part of width
                    let tempY = y - height/2;
                    this.p.fill(255);
                    if (ratio > .15){
                        this.p.rect(tempX, tempY, tempWidth, height, 0, 20, 20, 0);
                    } else if (ratio > .10){
                        this.p.rect(tempX, tempY, tempWidth, height, 5, 20, 20, 5);
                    } else if (ratio > .05){
                        this.p.rect(tempX, tempY, tempWidth, height, 10, 20, 20, 10);
                    } else {
                        this.p.rect(tempX, tempY, tempWidth, height, 20);
                    }
                }
                this.p.pop();

                // Increase Y so we go down to the next line
                y += columnHeight;
                ruleIndex++;
            }

        console.log(`Showing ${RulesView.rules.rules.length} rules!`)

        // Remove the temp style
        this.p.pop();
    }

    /**
     * Set the order of the features
     * @param {[Feature]} featureOrder A list of features, ordered in the way they should appear.
     */
    static setFeatureOrder(featureOrder) {
        RulesView.featureOrder = featureOrder;

        RulesView.outcomeColors.clear();

        // Try to assign colors to the outcomes.
        this.assignColorsToOutcomes();

        this.fillClickedFeatures();
    }


    /**
     * Set the rules that can be shown.
     * @param {Rules} rules
     */
    static setRules(rules) {
        RulesView.rules = rules;
    }

    /**
     * Determine the number of cases in the whole dataset
     * @returns {number}
     */
    static determineNumberOfCases(){
        let sum = 0;
        for (let rule of RulesView.rules.rules){
            sum += rule.truePositives;
            sum += rule.falsePositives;
        }
        return sum;
    }

    /**
     * Try to assign unique color to each outcome. It uses the {@link featureOrder} variable to determine the label that has the outcome values.
     */
    static assignColorsToOutcomes() {
        // Find the feature that is the outcome feature
        let outcomeFeature = RulesView.featureOrder.find(feature => feature.isLabel);

        if (outcomeFeature !== undefined) {
            let index = 0;
            // Loop over the feature that has the outcomes and assign a color to each outcome value
            for (let value of outcomeFeature.values) {
                RulesView.outcomeColors.set(value, Object.keys(RulesView.possibleColors)[index]);
                index++;
            }
        }
    }

    static fillClickedFeatures(){
        for (let feature of RulesView.featureOrder){
            RulesView.clickedFeatures.set(feature, false);
        }
    }

    static filterRulesByVal(rules_to_filter, criteria) {
        return rules_to_filter.filter(function(obj) {
            return Object.keys(criteria).every(function(c) {
                return obj[c] >= criteria[c];
            });
        });
    }

}



class ControlView {

    static features = [];

    constructor(p) {
        this._p = null;
        this.p = p;
    }

    get setup() {
        let self = this;

        return function () {
            // We draw an initial canvas.
            let canvas = self.p.createCanvas(self.p.windowWidth * controlViewWidth, self.p.windowHeight);
            canvas.background(255);
            canvas.position(0, 0);

            self.drawBorder();
        }
    }

    get draw() {
        let self = this;
        return function () {

        }
    }

    drawBorder() {
        this.p.stroke("#9AA6AB");
        this.p.strokeWeight(4);
        this.p.rect(0, 0, this.p.width, this.p.height);

        // Draw title of structural view
        this.p.noStroke();
        this.p.textSize(32);
        this.p.textAlign(this.p.CENTER);
        this.p.text("Control view", this.p.width / 2, 30);
    }

    get p() {
        return this._p;
    }

    set p(original) {
        this._p = original;
        this._p.draw = this.draw;
        this._p.setup = this.setup;
    }

    static setFeatures(features){
        ControlView.features = features;
    }
}

class FilterView {

    static support_val = 0;
    static conf_val = 0;

    constructor(p) {
        this._p = null;
        this.p = p;
        this.slider_support = null;
        this.slider_confidence = null;
    }

    get setup() {
        let self = this;

        return function () {
            // We draw an initial canvas.
            let canvas = self.p.createCanvas(self.p.windowWidth * filterViewWidth, self.p.windowHeight / 2);
            canvas.background(255);
            canvas.position((controlViewWidth + rulesViewWidth) * self.p.windowWidth, 0);

            self.drawBorder();

            // Generate a temp style for this view
            self.p.push();
            self.p.textSize(15);

            self.setupSliders(canvas.x, canvas.y);

            self.p.pop();
        }
    }

    get draw() {
        let self = this;
        return function () {
            self.supportSliderOnChange();
            self.confSliderOnChange();
        }
    }

    drawBorder() {
        this.p.stroke("#181818");
        this.p.strokeWeight(4);
        this.p.rect(0, 0, this.p.width, this.p.height);

        // Draw title of structural view
        this.p.noStroke();
        this.p.textSize(32);
        this.p.textAlign(this.p.CENTER);
        this.p.text("Filter view", this.p.width / 2, 30);
    }

    setupSliders(canvas_x, canvas_y) {
        this.slider_support = this.p.createSlider(0, 100, 0);
        this.slider_confidence = this.p.createSlider(0, 100, 0);

        this.slider_support.position( canvas_x + 20,  canvas_y + 50);
        this.slider_confidence.position( canvas_x + 20, canvas_y + 100 );
        this.p.text('Support',   this.slider_support.width + this.slider_support.width/2,   this.slider_support.y + this.slider_support.height );
        this.p.text('Confidence',    this.slider_confidence.width + this.slider_confidence.width/2,   this.slider_confidence.y + this.slider_confidence.height);


        this.slider_support.input(this.supportSliderOnChange);
        this.slider_confidence.input(this.confSliderOnChange);

    }

    supportSliderOnChange(){
        FilterView.support_val = this.slider_support.value();
    }

    confSliderOnChange(){
        FilterView.conf_val = this.slider_confidence.value();
    }

    get p() {
        return this._p;
    }

    set p(original) {
        this._p = original;
        this._p.draw = this.draw;
        this._p.setup = this.setup;
    }
}

class InfoView {
    constructor(p) {
        this._p = null;
        this.p = p;
    }

    get setup() {
        let self = this;

        return function () {
            // We draw an initial canvas.
            let canvas = self.p.createCanvas(self.p.windowWidth * filterViewWidth, self.p.windowHeight / 2);
            canvas.background(255);
            canvas.position((controlViewWidth + rulesViewWidth) * self.p.windowWidth, self.p.windowHeight / 2);

            self.drawBorder();
        }
    }

    get draw() {
        let self = this;
        return function () {

        }
    }

    drawBorder() {
        this.p.stroke("#272727");
        this.p.strokeWeight(4);
        this.p.rect(0, 0, this.p.width, this.p.height);

        // Draw title of structural view
        this.p.noStroke();
        this.p.textSize(32);
        this.p.textAlign(this.p.CENTER);
        this.p.text("Info view", this.p.width / 2, 30);
    }

    get p() {
        return this._p;
    }

    set p(original) {
        this._p = original;
        this._p.draw = this.draw;
        this._p.setup = this.setup;
    }
}

class Drawing {

    constructor() {
        // Generate views automatically.
        // this.structuralDrawing = new p5(this.buildStructuralView);
        this.nodeView = new p5(this.buildControlView);
        this.detailedView = new p5(this.buildRulesView);
        this.filterView = new p5(this.buildFilterView);
        this.infoView = new p5(this.buildInfoView);
    }

    buildStructuralView(p) {
        return new StructuralView(p);
    }

    buildControlView(p) {
        let sketch = new ControlView(p);
    }

    buildRulesView(p) {
        let sketch = new RulesView(p);
    }

    buildFilterView(p) {
        let sketch = new FilterView(p);
    }

    buildInfoView(p) {
        let sketch = new InfoView(p);
    }
}

class DrawnNode {
    /**
     * Represents a node that is drawn at a location
     * @param {Node} node Node data from DAG that is drawn here.
     * @param {number} x X-location
     * @param {number} y Y-location
     * @param {number} width Width of the node that is drawn
     */
    constructor(node, x, y, width) {
        this.nodeData = node;
        this.x = x;
        this.y = y;
        this.width = width;
    }


}


