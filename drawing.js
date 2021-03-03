class StructuralView {

    /**
     * DAG that we want to show
     * @type {DAG}
     */
    static DAG = null;

    /**
     * The order of the features.
     * @type {[Feature]}
     */
    static featureOrder = [];
    static depthDAG = 0;

    /**
     * The unique labels that are present in the DAG.
     * @type {[string]}
     */
    static differentLabels = [];

    /**
     * Keeping track of nodes that are (or should be) drawn.
     * @type {[DrawnNode]}
     */
    drawnNodes = []

    yOffset = 40;
    xOffset = 75;

    // Coordinates of selector square
    selectorSquare = {x: 0, y: 0, width: 250, height: 150};
    selectorSquareDrawn = false;
    previousMousePress = false;

    constructor(p) {
        this._p = null;
        this.p = p;
    }

    get setup() {
        let self = this;

        return function () {
            let canvas = self.p.createCanvas(self.p.windowWidth / 3, self.p.windowHeight / 2);
            canvas.background(255);
            canvas.position(0, 0);

            self.drawBorder();
            self.drawDecisionBorder();
        }
    }

    get draw() {
        let self = this;
        return function () {
            // Don't draw the DAG if there is nothing
            if (!StructuralView.DAG) {
                return;
            }

            self.p.noStroke();
            self.p.noFill();
            let color = self.p.color(255, 255);
            self.p.background(color);

            self.drawBorder();
            self.drawDecisionBorder();

            // First calculate where nodes are.
            self.calculateDrawings();

            // Then draw the nodes
            for (let drawnNode of self.drawnNodes) {

                // Check if this is a decision node
                if (drawnNode.nodeData.isLabelNode()) {
                    // Draw a square instead of a circle
                    self.p.noFill();
                    self.p.stroke(0);
                    self.p.square(drawnNode.x, drawnNode.y - drawnNode.width / 2, drawnNode.width);
                } else {
                    // Else, we're drawing a circle
                    self.p.fill(0);
                    self.p.stroke(0);
                    self.p.circle(drawnNode.x, drawnNode.y, drawnNode.width);
                }

                // Next draw the edges between the nodes.

                // Check if we have a 'true' edge.
                if (drawnNode.nodeData.true_node !== null) {
                    // Try to draw a line from this node to the true node
                    // Grab next node
                    let closeNode = self.drawnNodes.find(node => node.nodeData === drawnNode.nodeData.true_node);

                    // If we cannot find the next node, let's skip it.
                    if (closeNode === undefined || closeNode === null) {
                        continue;
                    }
                    self.p.stroke(0);

                    // Draw a curve between the current node and the next node.
                    self.p.line(drawnNode.x, drawnNode.y, closeNode.x, closeNode.y);

                    // Draw a triangle to signal an arrowhead - it faces rightwards!
                    self.p.triangle(closeNode.x - closeNode.width / 2, drawnNode.y,
                        closeNode.x - closeNode.width / 2 - 10, drawnNode.y + 10,
                        closeNode.x - closeNode.width / 2 - 10, drawnNode.y - 10);

                }

                // Check if we have a 'false' edge.
                if (drawnNode.nodeData.false_node !== null) {
                    // Try to draw a line from this node to the false node
                    // Grab next node
                    let closeNode = self.drawnNodes.find(node => node.nodeData === drawnNode.nodeData.false_node);

                    // If we cannot find the next node, let's skip it.
                    if (closeNode === undefined || closeNode === null) {
                        continue;
                    }

                    if (drawnNode.x < closeNode.x) {
                        // We're going to a node that's on the right of the currently drawn node
                        // This means that we have to draw a line straight down (to the Y line of the next node)
                        // and then draw a line from there to the next node.
                        // self.p.stroke("#2cb30e");
                        self.p.line(drawnNode.x, drawnNode.y, drawnNode.x, closeNode.y); // Draw line straight down
                        self.p.line(drawnNode.x, closeNode.y, closeNode.x, closeNode.y); // Draw horizontal line to the next node.

                        // Draw a triangle to signal an arrowhead - it faces rightwards!
                        self.p.triangle(closeNode.x - closeNode.width / 2, closeNode.y,
                            closeNode.x - closeNode.width / 2 - 10, closeNode.y + 10,
                            closeNode.x - closeNode.width / 2 - 10, closeNode.y - 10);

                    } else if (drawnNode.x > closeNode.x) {
                        // We're going to a node that's on the left of the currently drawn node.
                        // We want to draw line halfway between the two nodes.
                        // self.p.stroke("#b50d6c");

                        // Determine the distance (on the y-axis) between the two nodes.
                        let yDistance = Math.abs(closeNode.y - drawnNode.y);

                        // Draw a line halfway down.
                        self.p.line(drawnNode.x, drawnNode.y, drawnNode.x, drawnNode.y + (yDistance / 2));
                        // Draw line to the left.
                        self.p.line(drawnNode.x, drawnNode.y + (yDistance / 2), closeNode.x, drawnNode.y + (yDistance / 2));
                        // Draw line down to the next node.
                        self.p.line(closeNode.x, drawnNode.y + (yDistance / 2), closeNode.x, closeNode.y);

                        // Draw a triangle to signal an arrowhead - it faces downwards!
                        self.p.triangle(closeNode.x, closeNode.y - closeNode.width / 2,
                            closeNode.x - 10, closeNode.y - closeNode.width / 2 - 10,
                            closeNode.x + 10, closeNode.y - closeNode.width / 2 - 10);
                    } else {

                        // Draw a line straight down.
                        self.p.line(drawnNode.x, drawnNode.y, closeNode.x, closeNode.y);

                        // Draw a triangle to signal an arrowhead
                        self.p.triangle(closeNode.x, closeNode.y - closeNode.width / 2,
                            closeNode.x - 10, closeNode.y - closeNode.width / 2 - 10,
                            closeNode.x + 10, closeNode.y - closeNode.width / 2 - 10);
                    }

                }
            }

            console.log(self.p.mouseIsPressed);

            if (self.p.mouseIsPressed) {
                // Draw the selector square
                self.selectorSquareDrawn = true;

                if (self.previousMousePress === false) {
                    self.selectorSquare.x = self.p.mouseX;
                    self.selectorSquare.y = self.p.mouseY;
                }


                self.selectorSquare.width = Math.abs(self.selectorSquare.x - self.p.mouseX);
                self.selectorSquare.height = Math.abs(self.selectorSquare.y - self.p.mouseY);

                self.previousMousePress = true;

                // self.selectorSquare.x = self.p.mouseX - self.selectorSquare.width / 2;
                // self.selectorSquare.y = self.p.mouseY - self.selectorSquare.height;
            } else {
                self.previousMousePress = false;
               self.selectorSquareDrawn = false;
            }

            // Now draw selector field (if needed)
            if (self.selectorSquareDrawn) {
                // Let's draw the selector field

                let color = self.p.color("#fcba03");

                color.setAlpha(15);

                self.p.fill(color);
                self.p.stroke("#fcba03");
                self.p.strokeWeight(3);
                self.p.rect(self.selectorSquare.x, self.selectorSquare.y,
                    self.selectorSquare.width, self.selectorSquare.height);


            }
        }
    }

    calculateDrawings() {

        // Clear all drawn nodes
        this.drawnNodes.length = 0;

        // Get the unique number of labels we have, but
        let numberOfLabels = StructuralView.featureOrder.length;
        let featureWidth = this.getCanvasWidth() / numberOfLabels;
        let featureHeight = this.getCanvasHeight();

        let featureSpace = [];

        for (let index = 0; index < numberOfLabels; index++) {
            let x = featureWidth + featureWidth * index;

            // self.p.stroke(0);
            // self.p.strokeWeight(1);
            // self.p.line(x, self.yOffset, x, self.yOffset + featureHeight);
            featureSpace.push({feature: StructuralView.featureOrder[index], xStart: x - featureWidth, xEnd: x});
        }

        let sizeOfNode = Math.min(60, this.getCanvasHeight() / StructuralView.DAG.getNodes().filter(node => node.isLabelNode()).length)
        let yHeight = sizeOfNode;
        let ySpacing = sizeOfNode * 1.7;

        // Draw nodes
        for (let node of StructuralView.DAG.getNodes()) {

            // Find the dimensions of this feature
            let dimensions = featureSpace.find(space => space.feature.name === node.feature.name)

            // We couldn't find any dimensions!
            if (dimensions === undefined) {
                continue;
            }

            let width = dimensions.xEnd - dimensions.xStart;

            // Put node here.
            this.drawnNodes.push(new DrawnNode(node, dimensions.xStart + width / 2, this.yOffset + yHeight,
                sizeOfNode));

            // We reached a decision node, so we increase the Y spacing (because we're on a new line).
            if (node.isLabelNode()) {
                yHeight += ySpacing;
            }

        }
    }

    drawBorder() {
        this.p.stroke("#C59EAE");
        this.p.strokeWeight(4);
        this.p.rect(0, 0, this.p.width, this.p.height);

        // Draw title of structural view
        this.p.noStroke();
        this.p.fill(0);
        this.p.textSize(32);
        this.p.textAlign(this.p.CENTER);
        this.p.text("Structural view", this.p.width / 2, 30);

        // Draw horizontal bar below text
        this.p.stroke(0);
        this.p.strokeWeight(1);
        this.p.line(0, this.yOffset, this.p.width, this.yOffset);

    }

    /**
     * Draw area when decision nodes are shown
     */
    drawDecisionBorder() {
        // Draw vertical border for decision nodes
        // this.p.stroke(0);
        // this.p.strokeWeight(1);
        // this.p.line(this.p.width - this.xOffset,
        //     this.yOffset, this.p.width - this.xOffset, this.p.height);
    }

    getCanvasWidth() {
        return this.p.width;
    }

    getCanvasHeight() {
        return this.p.height - this.yOffset;
    }

    get p() {
        return this._p;
    }

    set p(original) {
        this._p = original;
        this._p.draw = this.draw;
        this._p.setup = this.setup;
    }

    /**
     * Set the DAG of the structural view.
     * @param dag
     */
    static setDagData(dag) {
        StructuralView.DAG = dag
        StructuralView.depthDAG = dag.getDepth();

        let seenLabels = [];

        // Find all different labels that are used
        for (let node of dag.getNodes()) {
            // We haven't seen this label before
            if (seenLabels.indexOf(node.feature.name) === -1) {
                seenLabels.push(node.feature.name);
            }
        }

        // Record the unique labels in this DAG.
        StructuralView.differentLabels = seenLabels;

        console.log(`Loaded DAG into structural view!`)
    }

    /**
     * Get the index (zero-based) of the name of the feature in the current feature ordering
     * @param featureName Name of the feature to search
     * @return The index of the feature in the feature ordering. Will return -1 if the feature is not found!
     */
    getFeatureIndex(featureName) {
        let index = 0;
        for (let feature of StructuralView.featureOrder) {
            if (feature.name === featureName) {
                return index;
            }

            index++;
        }

        return -1;
    }

    /**
     * Set the order of the features
     * @param {[Feature]} featureOrder A list of features, ordered in the way they should appear.
     */
    static setFeatureOrder(featureOrder) {
        StructuralView.featureOrder = featureOrder.filter(feature => StructuralView.differentLabels.includes(feature.name));
    }
}

class DetailedView {
    constructor(p) {
        this._p = null;
        this.p = p;
    }

    get setup() {
        let self = this;

        return function () {
            // We draw an initial canvas.
            let canvas = self.p.createCanvas(self.p.windowWidth / 2, self.p.windowHeight);
            canvas.background(144);
            canvas.position(self.p.windowWidth / 3, 0);

            self.drawBorder();
        }
    }

    get draw() {
        let self = this;
        return function () {
            if (self.p.mouseIsPressed) {
                self.p.stroke('purple');
                let x = self.p.mouseX;
                let y = self.p.mouseY;
                self.p.point(x, y, 10);
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
        this.p.text("Detailed view", this.p.width / 2, 30);
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

class NodeView {
    constructor(p) {
        this._p = null;
        this.p = p;
    }

    get setup() {
        let self = this;

        return function () {
            // We draw an initial canvas.
            let canvas = self.p.createCanvas(self.p.windowWidth / 3, self.p.windowHeight / 2);
            canvas.background(255);
            canvas.position(0, self.p.windowHeight / 2);

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
        this.p.text("Node view", this.p.width / 2, 30);
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

class FilterView {
    constructor(p) {
        this._p = null;
        this.p = p;
    }

    get setup() {
        let self = this;

        return function () {
            // We draw an initial canvas.
            let canvas = self.p.createCanvas(self.p.windowWidth / 6, self.p.windowHeight / 2);
            canvas.background(255);
            canvas.position(5 * (self.p.windowWidth / 6), 0);

            self.drawBorder();
        }
    }

    get draw() {
        let self = this;
        return function () {

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
            let canvas = self.p.createCanvas(self.p.windowWidth / 6, self.p.windowHeight / 2);
            canvas.background(255);
            canvas.position(5 * (self.p.windowWidth / 6), self.p.windowHeight / 2);

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
        this.structuralDrawing = new p5(this.buildStructuralView);
        this.nodeView = new p5(this.buildNodeView);
        this.detailedView = new p5(this.buildDetailedView);
        this.filterView = new p5(this.buildFilterView);
        this.infoView = new p5(this.buildInfoView);
    }

    buildStructuralView(p) {
        return new StructuralView(p);
    }

    buildNodeView(p) {
        let sketch = new NodeView(p);
    }

    buildDetailedView(p) {
        let sketch = new DetailedView(p);
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


