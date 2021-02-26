class StructuralView {

    static DAG = null;

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
        }
    }

    get draw() {
        let self = this;
        return function () {
            if (!StructuralView.DAG) {
                return;
            }

        }
    }

    drawBorder() {
        this.p.stroke("#C59EAE");
        this.p.strokeWeight(4);
        this.p.rect(0, 0, this.p.width, this.p.height);

        // Draw title of structural view
        this.p.noStroke();
        this.p.textSize(32);
        this.p.textAlign(this.p.CENTER);
        this.p.text("Structural view", this.p.width / 2, 30);
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
        console.log(`Loaded DAG into structural view!`)
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


