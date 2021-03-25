rulesViewWidth = 4 / 6;
controlViewWidth = 1 / 6;
filterViewWidth = 1 / 6;

darkModeColors = {
    backgroundColor: `#121212`,
    secondaryBackgroundColor: '#323232',
    primaryColor: `#c9d1d9`,
    secondaryColor: '#8b949e'
}

lightModeColors = {
    backgroundColor: `#ffffff`,
    secondaryBackgroundColor: '#cccccc',
    primaryColor: `#121212`,
    secondaryColor: '#323232'
}

backgroundColor = lightModeColors["backgroundColor"];
secondaryBackgroundColor = lightModeColors["secondaryBackgroundColor"];
primaryColor = lightModeColors["primaryColor"];
secondaryColor = lightModeColors["secondaryColor"];

darkmode = false;


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
     * The filtered that are shown
     * @type {Rules}
     */
    static filtered_rules = null;

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
        blue: "#1976d2",
        orange: "#f57c00",
        green: "#388e3c",
        red: "#d32f2f",
        purple: "#7b1fa2",
        brown: "#5d4037",
        pink: "#d81b60",
        gray: "#616161",
        olive: "#afb42b",
        cyan: "#0097a7"
    };

    static possibleDarkColors = {
        blue: "#90caf9",
        orange: "#ffcc80",
        green: "#a5d6a7",
        red: "#ef9a9a",
        purple: "#ce93d8",
        brown: "#bcaaa4",
        pink: "#f48fb1",
        gray: "#eeeeee",
        olive: "#e6ee9c",
        cyan: "#80deea"
    };


    static attributeColumnHeight = 40;
    static attributeColumnWidth = 40;
    static last_x;

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
            if (self.p.mouseY < self.yOffset + RulesView.attributeColumnHeight && self.p.mouseY > self.yOffset) {
                let index_feature = Math.floor((self.p.mouseX - self.xMargin) / RulesView.attributeColumnWidth);
                if (index_feature > 0 && index_feature < RulesView.featureOrder.length) {
                    self.p.cursor('hand');
                } else {
                    self.p.cursor('default');
                }
            } else {
                self.p.cursor('default');
            }

            self.p.background(backgroundColor);

            // Don't draw anything if we have no features.
            if (RulesView.featureOrder.length === 0) {
                return;
            }

            // Draw attribute labels.
            self.drawFeatureLabels();

            // Stop drawing if there are no rules.
            if (RulesView.rules == null || RulesView.rules.rules.length < 1) {
                return;
            }

            // We can draw the rules now.
            self.drawRules();

        }
    }

    get mouse_clicked() {
        let self = this;
        return function () {
            if (self.p.mouseY < self.yOffset + RulesView.attributeColumnHeight && self.p.mouseY > self.yOffset) {
                console.log(self.p.mouseY);

                let index_feature = Math.floor((self.p.mouseX - self.xMargin) / RulesView.attributeColumnWidth);
                if (index_feature > 0 && index_feature < RulesView.featureOrder.length) {
                    let feature = RulesView.featureOrder[index_feature - 1];
                    let clicked = RulesView.clickedFeatures.get(feature);
                    RulesView.clickedFeatures.set(feature, !clicked);
                }
            }

        }
    }

    drawBorder() {
        this.p.push();
        this.p.fill(backgroundColor);
        this.p.stroke("#FFC114");
        this.p.strokeWeight(4);
        this.p.rect(0, 0, this.p.width, this.p.height);
        this.p.pop();

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
        this._p.mouseClicked = this.mouse_clicked;
    }

    /**
     * This method draws the columns for the attributes.
     */
    drawFeatureLabels() {
        let offset = 1;
        // Determine the width of a column
        let widthPerLabel = (this.p.width - 2 * this.xMargin) / (RulesView.featureOrder.length + 1); //also draw incoming edges
        // Set a fixed height for the columns
        RulesView.attributeColumnHeight = this.p.height / 25;
        let heightPerLabel = RulesView.attributeColumnHeight;

        let index = 0;

        // Create new temporary style
        this.p.push();
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.textSize(Math.min(25, heightPerLabel / 2));

        // For all features, draw a box
        for (let feature of RulesView.featureOrder) {
            if (feature.name === "label") { //do not draw the label
                continue;
            }

            if (index > 0) { // do not draw first line
                let x = this.xMargin + ((index + offset) * widthPerLabel); //set off by one for incoming edge
                let y = this.yOffset;
                let yEnd = this.yOffset + this.p.height;
                this.p.stroke(secondaryBackgroundColor);
                this.p.strokeWeight(0.5);
                // Draw column for label
                this.p.line(x, y, x, yEnd);
            }

            this.p.push();

            let x = this.xMargin + ((index + offset) * widthPerLabel) + 10; //set off by one for incoming edge
            let y = this.yOffset + heightPerLabel;


            //show icon to indicate attribute is selected
            if (RulesView.clickedFeatures.get(feature)) {
                this.p.push();
                this.p.stroke(0, 92, 71);
                this.p.strokeWeight(2);
                this.p.fill(backgroundColor);
                this.p.triangle(x - 5, y - 5, x + 5, y - 5, x, y + 5);
                this.p.pop();
            }
            this.p.strokeWeight(primaryColor);
            this.p.fill(primaryColor);
            x = this.xMargin + ((index + offset) * widthPerLabel) + widthPerLabel / 2; //set off by one for incoming edge

            this.p.push();
            // Draw the names of the features on top
            this.p.textSize(12);
            this.p.strokeWeight(0);
            this.p.textStyle(this.p.NORMAL);
            this.p.textAlign(this.p.LEFT, this.p.CENTER);
            // P5 works a bit weird with rotations. Objects rotate with respect to the origin
            // This means that I have to place the text on the origin, rotate it and then translate it to where I want it to go.
            this.p.translate(x, 1.25 * this.yOffset + heightPerLabel);
            this.p.rotate(degreeToRadians(-90));
            this.p.text(feature.name, 0, 0);
            this.p.pop();


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
        let columnWidth = (this.p.width - 2 * this.xMargin) / (RulesView.featureOrder.length + 1); //leave room for incoming edge
        RulesView.attributeColumnWidth = columnWidth;
        // Set a fixed height for the columns
        let columnHeight = (this.p.height - 2 * this.yOffset - RulesView.attributeColumnHeight)
            / 30;

        // Set the first y to be at the bottom of the first row.
        let y = this.yOffset + RulesView.attributeColumnHeight + columnHeight;

        // Generate a temp style
        this.p.push();
        this.p.textAlign(this.p.LEFT, this.p.BOTTOM);
        this.p.textSize(Math.min(15, columnHeight * 3 / 5));

        let ruleIndex = 0;
        let number_of_not_shown_rules = 0;
        // For each rule, draw a row.
        loop1:
            for (let rule of RulesView.filtered_rules.rules) {
                let tp = rule.truePositives;
                let fp = rule.falsePositives;
                let ratio = 0;
                if (tp + fp > 0) {
                    ratio = tp / (tp + fp);
                } else {
                    ratio = 0;
                }
                //check if we should draw rule according to mouse clicks
                for (let [feature, clicked] of RulesView.clickedFeatures.entries()) {
                    if (clicked) {
                        if (!rule.conditions.has(feature)) {
                            continue loop1; //continue to the next rule
                        }
                    }
                }

                // only draw top 30 rules
                if (ruleIndex > 29) {
                    continue; //continue to the next rule
                }

                // Calculate the start of the line
                let xStart = this.xMargin + .4 * columnWidth;
                // And the end of the line
                let xEnd = this.p.width - this.xMargin - 1 / 4 * columnWidth;

                //set the color of the line according to the label
                this.p.stroke(RulesView.outcomeColors.get(rule.label));

                // Draw the line
                this.p.strokeWeight(1);
                this.p.line(xStart, y, xEnd, y);

                // Draw values of conditions
                for (let [feature, condition] of rule.conditions.entries()) {
                    let value = condition.unicode_equality + " " + condition.value;
                    this.p.strokeWeight(0); // we want no stroke on the text or circle
                    let featureIndex = RulesView.featureOrder.indexOf(feature); //get location of feature

                    let x = this.xMargin + (featureIndex + offset) * columnWidth + columnWidth / 5; //set off by a half (since incoming edge)
                    this.p.fill(RulesView.outcomeColors.get(rule.label)); //set fill color of circle
                    this.p.circle(x, y, 10); //draw circle for decision node
                    this.p.fill(secondaryColor); // set text color
                    this.p.textSize(10);
                    this.p.text(value, x + 5, y - 2); //draw the text
                }
                this.p.strokeWeight(0);
                //Draw the incoming cases

                let tempX = this.xMargin; //set start value of X for incoming case distribution
                let totalWidth = .95 * columnWidth; // this is the space we have
                let remainingWidth = 1; // keep track of percentage of data not satisfied by rules
                for (const [label, color] of RulesView.outcomeColors.entries()) {
                    let percentageWidth = 0;
                    percentageWidth = rule.perLabelNumberOfInstances.get(label) / RulesView.determineNumberOfCases();
                    this.p.fill(color);  //set the fill of the label
                    this.p.rect(tempX + (percentageWidth * totalWidth) / 2, y, percentageWidth * totalWidth, columnHeight * .8); // draw rectangle
                    tempX += percentageWidth * totalWidth; //determine new locations
                    remainingWidth -= percentageWidth;
                }

                //draw rectangle for non-satisfied data
                this.p.fill(secondaryBackgroundColor);
                this.p.rect(tempX + (remainingWidth * totalWidth) / 2, y, remainingWidth * totalWidth, columnHeight * .8);

                // draw support number in rectangle
                this.p.push();
                this.p.textAlign(this.p.RIGHT, this.p.CENTER);
                this.p.fill(primaryColor);

                let support_text = rule.support;
                if (rule.support > 10){
                    support_text = support_text.toFixed(0);
                } else {
                    support_text = support_text.toFixed(2);
                }
                this.p.text(support_text, this.xMargin + totalWidth - 5, y);
                this.p.pop();
                // draw small rectangle on the left to indicate start of rule
                let x = this.xMargin + .95 * columnWidth;
                this.p.strokeWeight(1);
                this.p.stroke(150);
                this.p.fill(backgroundColor);
                this.p.rect(x, y, 5, columnHeight / 2 + 5, 2);

                // Draw the outcome label
                let featureIndex = RulesView.featureOrder.length - 1;
                x = this.xMargin + (featureIndex + offset + .6) * columnWidth; //set off by .5
                let height = 0.8 * columnHeight;
                let width = 0.95 * columnWidth;
                // for squircles, we need to draw the background first with the smallest area (determined by ratio)
                if (ratio > 0.5) {
                    this.p.fill(backgroundColor); // set fill color of rectangle //draw false positives
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
                if (ratio > 0.5) {
                    let tempX = x - width / 2; //set x to correct x for CORNER
                    let tempWidth = width * ratio; //find relative part of width
                    let tempY = y - height / 2;
                    this.p.fill(RulesView.outcomeColors.get(rule.label));
                    if (ratio < .85) {
                        this.p.rect(tempX, tempY, tempWidth, height, 20, 0, 0, 20);
                    } else if (ratio < 0.90) {
                        this.p.rect(tempX, tempY, tempWidth, height, 20, 5, 5, 20);
                    } else if (ratio < .95) {
                        this.p.rect(tempX, tempY, tempWidth, height, 20, 10, 10, 20);
                    } else {
                        this.p.rect(tempX, tempY, tempWidth, height, 20);
                    }
                } else { // draw negatives (due to squircles)
                    let tempX = x - width / 2 + width * ratio; //set x to correct x for CORNER
                    let tempWidth = width * (1 - ratio); //find relative part of width
                    let tempY = y - height / 2;
                    this.p.fill(backgroundColor);
                    if (ratio > .15) {
                        this.p.rect(tempX, tempY, tempWidth, height, 0, 20, 20, 0);
                    } else if (ratio > .10) {
                        this.p.rect(tempX, tempY, tempWidth, height, 5, 20, 20, 5);
                    } else if (ratio > .05) {
                        this.p.rect(tempX, tempY, tempWidth, height, 10, 20, 20, 10);
                    } else {
                        this.p.rect(tempX, tempY, tempWidth, height, 20);
                    }
                }
                this.p.pop();

                // draw confidence number in rectangle
                // this.p.push();
                // this.p.textAlign(this.p.CENTER, this.p.CENTER);
                // this.p.fill(0);
                // this.p.strokeWeight(0);
                // this.p.text(rule.confidence.toFixed(2) + "%", x, y);
                // this.p.pop();

                // Increase Y so we go down to the next line
                y += columnHeight;
                ruleIndex++;
                RulesView.last_x = x ;
            }

        console.log(`Showing ${RulesView.rules.rules.length} rules!`);

        this.p.push();
        this.p.fill(primaryColor);
        this.p.strokeWeight(0);
        this.p.textStyle(this.p.BOLD);
        this.p.textSize(10);
        let x = this.xMargin;
        y = this.yOffset + RulesView.attributeColumnHeight + columnHeight - 15;
        this.p.text(`Support (%)`, x, y);

        this.p.textAlign(this.p.CENTER);
        x = RulesView.last_x;
        y = this.yOffset + RulesView.attributeColumnHeight + columnHeight - 15;
        this.p.text(`Confidence`, x, y);
        this.p.pop();

        this.p.push();
        //print number of rules shown
        this.p.textAlign(this.p.LEFT);
        this.p.textStyle(this.p.NORMAL);
        this.p.textSize(10);
        this.p.strokeWeight(0);
        this.p.fill(primaryColor);
        x = this.xMargin;
        y = 25;
        this.p.text(`${ruleIndex}/${RulesView.rules.rules.length} rules`, x, y);
        this.p.text(`shown`, x, y + 12);

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

        FilterView.determineMaxNumberOfValues();
    }


    /**
     * Set the rules that can be shown.
     * @param {Rules} rules
     */
    static setRules(rules) {
        if (RulesView.rules === null) {
            RulesView.rules = new Rules();
        }

        if (RulesView.filtered_rules === null) {
            RulesView.filtered_rules = new Rules();
        }

        RulesView.rules.rules = [...rules.rules];
        RulesView.filtered_rules.rules = [...rules.rules];
    }

    /**
     * Determine the number of cases in the whole dataset
     * @returns {number}
     */
    static determineNumberOfCases() {
        let sum = 0;
        for (let rule of RulesView.rules.rules) {
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
                if (darkmode) {
                    RulesView.outcomeColors.set(value, Object.values(RulesView.possibleDarkColors)[index]);
                } else {
                    RulesView.outcomeColors.set(value, Object.values(RulesView.possibleColors)[index]);
                }
                index++;
            }
        }
    }

    static fillClickedFeatures() {
        for (let feature of RulesView.featureOrder) {
            RulesView.clickedFeatures.set(feature, false);
        }
    }

}


class ControlView {

    static features = [];
    static darkModeCheckBox = null;

    constructor(p) {
        this._p = null;
        this.p = p;
    }

    get setup() {
        let self = this;

        return function () {
            // We draw an initial canvas.
            let canvas = self.p.createCanvas(self.p.windowWidth * controlViewWidth, 3 / 5 * self.p.windowHeight);
            canvas.background(backgroundColor);
            canvas.position(0, 0);

            self.setUpCheckBoxDarkMode();
        }
    }

    setUpCheckBoxDarkMode() {
        let checkbox = this.p.createCheckbox();
        checkbox.position(90, 60);
        //Add a function to when the checkboxes are clicked
        checkbox.changed(this.switchDarkMode);
        ControlView.darkModeCheckBox = checkbox;
    }

    switchDarkMode() {
        darkmode = ControlView.darkModeCheckBox.checked();
        let color_map = lightModeColors;
        if (darkmode) {
            color_map = darkModeColors
        }
        backgroundColor = color_map["backgroundColor"];
        secondaryBackgroundColor = color_map["secondaryBackgroundColor"];
        primaryColor = color_map["primaryColor"];
        secondaryColor = color_map["secondaryColor"];

        RulesView.assignColorsToOutcomes();
        FilterView.mySelectEvent();
    }

    get draw() {
        let self = this;
        return function () {
            self.drawBorder();
            self.drawText();
        }
    }

    drawBorder() {
        this.p.push();
        this.p.fill(backgroundColor);
        this.p.stroke("#9AA6AB");
        this.p.strokeWeight(4);
        this.p.rect(0, 0, this.p.width, this.p.height);
        this.p.pop();

        // Draw title of structural view
        this.p.noStroke();
        this.p.textSize(32);
        this.p.textAlign(this.p.CENTER);
        this.p.fill(primaryColor);
        this.p.text("Control view", this.p.width / 2, 30);
    }

    drawText() {
        this.p.push();
        this.p.textSize(12);
        this.p.fill(primaryColor);
        this.p.textAlign(this.p.LEFT, this.p.CENTER);
        this.p.text("Dark mode:", 25, 70);
        this.p.pop();
    }

    get p() {
        return this._p;
    }

    set p(original) {
        this._p = original;
        this._p.draw = this.draw;
        this._p.setup = this.setup;
    }

    static setFeatures(features) {
        ControlView.features = features;
    }
}

class FilterView {

    static xMargin = 25;
    static yMargin = 75;
    static xSliderMargin = 110;
    static supportVal = 1;
    static confVal = 0;
    /**
     *
     * @type {p5.Element}
     */
    static sliderSupport = null;

    /**
     *
     * @type {p5.Element}
     */
    static sliderConfidence = null;

    /**
     *
     * @type {p5.Element}
     */
    static p5 = null;

    /**
     *
     * @type {p5.Element}
     */
    static canvas = null;

    /**
     *
     * @type {p5.Element}
     */
    static selectBox = null;

    /**
     *
     * @type {[p5.Element]}
     */

    static checkboxes = [];

    /**
     *
     * @type {Map<String, [String]>}
     */
    static selectedAttributes = new Map();

    /**
     *
     * @type {[Rectangle]}
     */
    static filterBoxes = [];

    /**
     *
     * @type {[p5.Element]}
     */
    static filteredAttributesElements = [];

    /**
     *
     * @type {boolean}
     */
    static newFiltersSelected = false;

    static selectedFeatureIsNumeric = true;

    static minInput = null;

    static maxInput = null;

    static maxNumberOfValues = 0;


    constructor(p) {
        this._p = null;
        this.p = p;
        FilterView.p5 = p;
        this.sliderSupport = null;
        this.sliderConfidence = null;
    }

    get setup() {
        let self = this;

        return function () {
            // We draw an initial canvas.
            let canvas = self.p.createCanvas(self.p.windowWidth * filterViewWidth, self.p.windowHeight);
            canvas.background(backgroundColor);
            canvas.position((controlViewWidth + rulesViewWidth) * self.p.windowWidth, 0);
            FilterView.canvas = canvas;

            self.drawBorder();

            // Generate a temp style for this view
            self.p.push();
            self.p.textSize(15);


            self.setupSliders();
            self.p.pop();
        }
    }

    get draw() {
        let self = this;
        return function () {
            self.p.background(backgroundColor);
            self.drawBorder();
            self.drawTexts();
            self.drawFilterBoxes();
        }
    }

    /**
     * Draw border of the view
     */
    drawBorder() {
        this.p.push();
        this.p.fill(backgroundColor);
        this.p.stroke("#181818");
        this.p.strokeWeight(4);
        this.p.rect(0, 0, this.p.width, this.p.height);
        this.p.pop();
    }


    /**
     * Each time the static titles need to be drawn, otherwise overwritten by background
     */
    drawTexts() {
        // Draw title of filter view
        this.p.noStroke();
        this.p.textSize(32);
        this.p.fill(primaryColor);
        this.p.textAlign(this.p.CENTER);
        this.p.text("Filter view", this.p.width / 2, 30);

        //Draw text of sliders
        this.p.textAlign(this.p.LEFT, this.p.CENTER);
        this.p.textSize(25);

        this.p.text('Filter the rules', FilterView.xMargin, FilterView.yMargin);
        FilterView.p5.text('Filter the data', FilterView.xMargin, FilterView.yMargin + 100);

        this.p.textSize(15);
        this.p.textStyle(this.p.BOLD);
        FilterView.p5.text('Feature:', FilterView.xMargin, FilterView.yMargin + 132);
        this.p.textStyle(this.p.NORMAL);
        this.p.textSize(15);
        this.p.text('Support', FilterView.xMargin, FilterView.sliderSupport.y + FilterView.sliderSupport.height / 2);
        this.p.text('Confidence', FilterView.xMargin, FilterView.sliderConfidence.y + FilterView.sliderConfidence.height / 2);

        let x_slider = FilterView.xSliderMargin + FilterView.sliderConfidence.width + 10;
        let y_slider = FilterView.sliderSupport.y + FilterView.sliderSupport.height / 2;

        this.p.text('(' + FilterView.supportVal + '%)', x_slider, y_slider);

        x_slider = FilterView.xSliderMargin + FilterView.sliderConfidence.width + 10;
        y_slider = FilterView.sliderConfidence.y + FilterView.sliderConfidence.height / 2;
        this.p.text('(' + FilterView.confVal + '%)', x_slider, y_slider);

        if (FilterView.selectedFeatureIsNumeric) {
            this.p.push();
            this.p.fill(primaryColor);
            this.p.textAlign(this.p.LEFT, this.p.CENTER);
            if (FilterView.minInput !== null) {
                this.p.text('Min:', FilterView.xMargin, FilterView.minInput.y + FilterView.minInput.height / 2);
                this.p.text('Max:', 2 * FilterView.xMargin + this.p.textWidth('Min: ') + FilterView.minInput.width, FilterView.minInput.y + FilterView.minInput.height / 2);
            }
            this.p.pop();
        }
    }

    /**
     * Draw the filterboxes accordingly to FilterView.selectedAttributes
     * Also update the list of filterboxes if needed
     */
    drawFilterBoxes() {
        //reset the previously drawn filterboxes, if a change has occured with the filterboxes
        //important to check, otherwise the filerboxes would be constantly emptied
        if (FilterView.newFiltersSelected) {
            FilterView.filterBoxes = [];
        }

        //create a new style
        this.p.push();
        //set start values

        let Y = 270;
        if (FilterView.maxNumberOfValues > 0) {
            Y = 225 + FilterView.maxNumberOfValues / 2 * 25 + 20;
        }

        let Y_step = 30;
        let X = FilterView.xMargin;


        for (let [feature, values] of FilterView.selectedAttributes.entries()) {
            // only draw if filter selected
            if (values.length === 0) {
                continue;
            }
            this.p.push()
            this.p.textSize(15);
            this.p.textStyle(this.p.BOLD);
            this.p.textAlign(this.p.LEFT);
            this.p.text(feature.name, FilterView.xMargin, Y);
            this.p.pop();
            Y += Y_step / 2;
            for (let value of values) {
                let text_in_box = value + '  \u2716'; //unicode for ✖
                if (X + this.p.textWidth(text_in_box) + 5 + 20 >= this.p.width) {
                    X = FilterView.xMargin;
                    Y += Y_step;
                }

                //set style for rectangle
                this.p.push();
                this.p.fill(secondaryBackgroundColor);
                this.p.stroke(secondaryBackgroundColor);
                this.p.strokeWeight(1);
                this.p.rectMode(FilterView.p5.CORNER);
                this.p.rect(X, Y, this.p.textWidth(text_in_box) + 5, 20, 3);
                //create filterbox
                let filterBox = new FilterBox(feature, value, X, Y, this.p.textWidth(text_in_box) + 5, 20);
                this.p.pop();
                //set style for text in rectangle
                this.p.push();
                this.p.fill(primaryColor);
                this.p.textAlign(FilterView.p5.CENTER);
                this.p.text(text_in_box, X + (this.p.textWidth(text_in_box) + 5) / 2, Y + 11);
                X += this.p.textWidth(text_in_box) + 5 + 20;
                this.p.pop();
                //add filterboxes if needed
                if (FilterView.newFiltersSelected) {
                    FilterView.filterBoxes.push(filterBox);
                }
            }
            Y += Y_step + 5;
            X = FilterView.xMargin;
        }
        this.p.pop();
        //set boolean to false
        FilterView.newFiltersSelected = false;

        //draw hand on boxes
        for (let filterbox of FilterView.filterBoxes) {
            if (filterbox.mouseIn(this.p.mouseX, this.p.mouseY)) {
                this.p.cursor('hand');
                break;
            } else {
                this.p.cursor('default');
            }
        }
    }

    /**
     * If mouse clicked, make sure to check if a filterbox is selected
     * If so, then remove the filterbox and filter of the selectedAttributes
     * @returns {function(...[*]=)}
     */
    get mouse_clicked() {
        let self = this;
        return function () {
            for (let filterbox of FilterView.filterBoxes) {
                //check if mouse clicked on one of the filterboxes
                if (filterbox.mouseIn(self.p.mouseX, self.p.mouseY)) {
                    // remove label if label in list
                    const index = FilterView.selectedAttributes.get(filterbox.feature).indexOf(filterbox.value);
                    if (index > -1) {
                        FilterView.selectedAttributes.get(filterbox.feature).splice(index, 1);
                    }
                    // update everything to include this change
                    FilterView.filterData();
                    FilterView.newFiltersSelected = true;
                    FilterView.mySelectEvent();
                }
            }

        }
    }

    /**
     * Create the sliders for confidence and support
     */
    setupSliders() {
        FilterView.sliderSupport = this.p.createSlider(0, 100, 1);
        FilterView.sliderConfidence = this.p.createSlider(0, 100, 0);
        FilterView.sliderSupport.position(FilterView.canvas.x + FilterView.xSliderMargin, FilterView.canvas.y + FilterView.yMargin + 25);
        FilterView.sliderConfidence.position(FilterView.canvas.x + FilterView.xSliderMargin, FilterView.canvas.y + FilterView.yMargin + 50);

        FilterView.sliderSupport.input(this.supportSliderOnChange);
        FilterView.sliderConfidence.input(this.confSliderOnChange);
    }

    /**
     * Update support according to the value of the slider
     * Update the rules
     */
    supportSliderOnChange() {
        FilterView.supportVal = FilterView.sliderSupport.value();
        FilterView.updateFilteredRules();
    }

    /**
     * Update confidence according to the value of the slider
     * Update the rules
     */
    confSliderOnChange() {
        FilterView.confVal = FilterView.sliderConfidence.value();
        FilterView.updateFilteredRules();
    }

    /**
     * Create a selected to select the Feature Attribute
     */
    static setupSelector() {
        let sel = FilterView.p5.createSelect();
        sel.size(200);
        sel.position(FilterView.canvas.x + FilterView.xMargin + FilterView.p5.textWidth("Feature:") + 10, FilterView.yMargin + 120);
        // add all features to the selector
        for (let feature of RulesView.featureOrder) {
            sel.option(feature.name);
            FilterView.selectedAttributes.set(feature, []);
        }
        //If selector changed, call mySelectEvent
        sel.changed(FilterView.mySelectEvent);
        //Save the selectBox as a static variable
        FilterView.selectBox = sel;
        //Call mySelectEvent for the first time
        FilterView.mySelectEvent();
    }

    /**
     * Method called when selector is changed
     * Creates checkboxes for all values of the selected feature
     */
    static mySelectEvent() {
        //request the feature of the selectBox
        let item = FilterView.selectBox.value();
        // remove all checkboxes
        for (let checkbox of FilterView.checkboxes) {
            checkbox.remove();
        }

        if (FilterView.minInput !== null) {
            FilterView.minInput.remove();
            FilterView.minInput = null;
        }

        if (FilterView.maxInput !== null) {
            FilterView.maxInput.remove();
            FilterView.maxInput = null;
        }
        //Empty the list of checkboxes
        FilterView.checkboxes = [];

        let correct_feature = null;
        // find correct feature
        for (let feature of RulesView.featureOrder) {
            if (feature.name === item) {
                correct_feature = feature;
                break;
            }
        }

        if (correct_feature.isNumeric) {
            let minText = correct_feature.min;
            let maxText = correct_feature.max;
            for (let condition of FilterView.selectedAttributes.get(correct_feature)) {
                if (condition.includes("\u2265")) {
                    minText = condition.replace('\u2265', "");
                    minText = parseFloat(minText);
                }
                if (condition.includes("\u2264")) {
                    maxText = condition.replace('\u2264', "");
                    maxText = parseFloat(maxText);
                }
            }

            let minInput = FilterView.p5.createInput(minText);
            minInput.size(FilterView.p5.width / 2 - FilterView.p5.textWidth('Min: ') - FilterView.p5.textWidth('Max: '));

            minInput.position(FilterView.canvas.x + FilterView.xMargin + FilterView.p5.textWidth('Min: '), FilterView.canvas.y + 225);
            let maxInput = FilterView.p5.createInput(maxText);
            maxInput.size(FilterView.p5.width / 2 - FilterView.p5.textWidth('Min: ') - FilterView.p5.textWidth('Max: '));
            maxInput.position(minInput.x + minInput.width + FilterView.p5.textWidth('Max: ') + FilterView.xMargin, FilterView.canvas.y + 225);

            FilterView.minInput = minInput;
            FilterView.maxInput = maxInput;
            minInput.input(FilterView.myInputEvent);
            maxInput.input(FilterView.myInputEvent);

        } else { //draw checkboxes if values are not numerical
            let columns = 2;
            let Y = FilterView.canvas.y + 200;
            let Y_step = 25;
            let X_step = (FilterView.canvas.width - 50) / columns;
            let index = 0;
            for (let value of correct_feature.values) {
                //Only draw as much items as columns on a row
                if (index % columns === 0) {
                    Y += Y_step;
                }
                let checked = true;
                // set checked to false if not in the selected Attributes list
                if (FilterView.selectedAttributes.get(correct_feature).indexOf(value) === -1) {
                    checked = false;
                }
                FilterView.p5.push();

                //Create new checkboxes and position them
                let checkbox = FilterView.p5.createCheckbox(value, checked);
                checkbox.style('color', primaryColor);
                checkbox.position(FilterView.canvas.x + FilterView.xMargin + (index % columns) * X_step, Y);
                //Add a function to when the checkboxes are clicked
                checkbox.changed(FilterView.myCheckedEvent);
                //Add checkbox to list
                FilterView.checkboxes.push(checkbox);
                FilterView.p5.pop();
                index += 1;
            }
        }
    }

    /**
     * Method called when a checkbox is checked
     * Add the attribute to the selectedAttributes and update the data, and rules
     */
    static myCheckedEvent() {
        let feature_name = FilterView.selectBox.value();
        let correct_feature = null;
        for (let feature of RulesView.featureOrder) {
            if (feature.name === feature_name) {
                correct_feature = feature;
                break;
            }
        }

        for (let checkbox of FilterView.checkboxes) {
            let label = checkbox.elt.value;
            if (checkbox.checked()) {
                // add label if label not in list yet
                if (FilterView.selectedAttributes.get(correct_feature).indexOf(label) === -1) {
                    FilterView.selectedAttributes.get(correct_feature).push(label);
                }
            } else {
                // remove label if label in list
                const index = FilterView.selectedAttributes.get(correct_feature).indexOf(label);
                if (index > -1) {
                    FilterView.selectedAttributes.get(correct_feature).splice(index, 1);
                }
            }
        }
        FilterView.filterData();
        //Set to true such that the filterboxes are updated
        FilterView.newFiltersSelected = true;
    }

    static myInputEvent() {
        let feature_name = FilterView.selectBox.value();
        let correct_feature = null;
        for (let feature of RulesView.featureOrder) {
            if (feature.name === feature_name) {
                correct_feature = feature;
                break;
            }
        }

        let min_value = FilterView.minInput.value();
        let max_value = FilterView.maxInput.value();

        // make list empty again
        FilterView.selectedAttributes.set(correct_feature, []);

        if (parseFloat(min_value) !== correct_feature.min) {
            FilterView.selectedAttributes.get(correct_feature).push(`\u2265 ${min_value}`);
        }
        if (parseFloat(max_value) !== correct_feature.max) {
            FilterView.selectedAttributes.get(correct_feature).push(`\u2264 ${max_value}`);
        }

        FilterView.filterData();
        //Set to true such that the filterboxes are updated
        FilterView.newFiltersSelected = true;
    }

    /**
     * Method to filter the data of the all_data object
     */
    static filterData() {
        let map = new Map();
        for (let [feature, values] of FilterView.selectedAttributes.entries()) {
            // only add those items that are selected
            if (values.length > 0) {
                map.set(feature, values);
            }
        }
        //Update
        all_data.filtered_data = all_data.filterData(map);
        all_data.rules.calculateSupportAndConf(all_data.filtered_data);
        FilterView.updateFilteredRules();
    }

    /**
     * Call method to update the rules according to support and confidence
     */
    static updateFilteredRules() {
        RulesView.filtered_rules.rules = FilterView.filterRulesByVal(RulesView.rules.rules, {
            support: FilterView.supportVal,
            confidence: FilterView.confVal
        });
    }

    /**
     * Update rules according to support and confidence
     * @param rules_to_filter
     * @param criteria
     * @returns {*}
     */
    static filterRulesByVal(rules_to_filter, criteria) {
        return rules_to_filter.filter(function (rule) {
            return Object.keys(criteria).every(function (c) {
                if (!rule.meetConditions(FilterView.selectedAttributes)){
                    return false;
                }
                // check criteria
                if (c === "support"){
                    return rule[c] >= criteria[c]; //include non-supported rules (so also 0)
                } else { //so confidence
                    if (rule["support"] === 0){
                        return true; //confidence is undefined
                    }
                    return rule[c] >= criteria[c];
                }
            });
        });
    }


    static determineMaxNumberOfValues() {
        for (let feature of RulesView.featureOrder) {
            if (!feature.isNumeric) {
                FilterView.maxNumberOfValues = Math.max(FilterView.maxNumberOfValues, feature.numberOfValues);
            }
        }
    }

    get p() {
        return this._p;
    }

    set p(original) {
        this._p = original;
        this._p.draw = this.draw;
        this._p.setup = this.setup;
        this._p.mouseClicked = this.mouse_clicked;
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
            let canvas = self.p.createCanvas(self.p.windowWidth * filterViewWidth, self.p.windowHeight * 2 / 5);
            canvas.background(backgroundColor);
            canvas.position(0, self.p.windowHeight * 3 / 5);


        }
    }

    get draw() {
        let self = this;
        return function () {
            self.p.background(backgroundColor);
            self.drawBorder();
            self.drawPill();
            self.drawLegend();
        }
    }

    drawBorder() {
        this.p.push();
        this.p.fill(backgroundColor);
        this.p.stroke("#272727");
        this.p.strokeWeight(4);
        this.p.rect(0, 0, this.p.width, this.p.height);
        this.p.pop();
    }

    /**
     * Draw pill for legend
     */
    drawPill() {
        this.p.push();
        let ratio = 0.5;
        let outcomeFeature = RulesView.featureOrder.find(feature => feature.isLabel);
        //only draw if outcomeFeature is defined
        if (typeof outcomeFeature !== 'undefined') {
            let label = '';
            for (let value of outcomeFeature.values) {
                label = value;
                break;
            }
            //set stle
            let color = RulesView.outcomeColors.get(label);
            this.p.fill(color); // set fill color true positives // true postives
            this.p.stroke(color); //set stroke color of rectangle
            this.p.strokeWeight(1); //make sure stroke is drawn

            //set location and width
            let x = (this.p.width) / 2;
            let y = 60;
            let width = this.p.width - 100;
            //drae colored part of pull
            this.p.rectMode(this.p.CENTER);
            this.p.rect(x, y, width, 30, 50);

            //draw white part of pill
            let tempX = x + width / 4; //set x to correct x for CORNER
            let tempWidth = width * ratio; //find relative part of width
            this.p.fill(backgroundColor);
            this.p.rect(tempX, y, tempWidth, 30, 0, 50, 50, 0);

            //fill with text
            this.p.textAlign(this.p.LEFT);
            this.p.fill(backgroundColor);
            this.p.strokeWeight(0);
            this.p.textSize(12);
            x = (this.p.width) * 1 / 4;
            this.p.text('Correctly', x, y - 2);
            this.p.text('classified', x, y + 10);

            this.p.fill(color);
            x = (this.p.width) * 1 / 2 + 1 / 8 * width;
            this.p.text('Incorrectly', x, y - 2);
            this.p.text('classified', x + 2, y + 10);

            this.p.fill(primaryColor);
            this.p.textSize(25);
            this.p.textAlign(this.p.LEFT);
            this.p.text("Legend", 25, 30);
        }
        this.p.pop();
    }

    /**
     * Draw legend of labels
     */
    drawLegend() {
        // Draw labels outcome
        let x = 25;
        let y = 115 - 15;
        this.p.push();
        // Draw the text
        this.p.textAlign(this.p.LEFT);
        this.p.fill(primaryColor);
        this.p.strokeWeight(primaryColor);
        this.p.textSize(20);
        let title = "Labels:";
        this.p.text(title, 25, 115);
        this.p.pop();

        // Find correct outcomeFeature
        let outcomeFeature = RulesView.featureOrder.find(feature => feature.isLabel);
        // Only draw if outcomeFeature is defined
        if (typeof outcomeFeature !== 'undefined') {
            for (let value of outcomeFeature.values) {
                //create temp stule
                this.p.push();
                this.p.strokeWeight(0);
                this.p.textAlign(this.p.LEFT);
                this.p.rectMode(this.p.CORNER);
                this.p.textSize(20);
                this.p.fill(RulesView.outcomeColors.get(value));
                this.p.rect(x + this.p.textWidth(title) + 15, y, 15, 15);

                this.p.fill(primaryColor);
                this.p.textSize(15);
                this.p.textAlign(this.p.LEFT);
                this.p.text(value, x + this.p.textWidth(title) + 15 + 40, y + 10);
                this.p.pop();
                y += 20;
            }
        }
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

//Assumes a rectangle drawn from the corner
class FilterBox {
    constructor(feature, value, x, y, width, height) {
        this.feature = feature;
        this.value = value;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    mouseIn(x, y) {
        if (this.x <= x && x <= this.x + this.width) {
            if (this.y <= y && y <= this.y + this.height) {
                return true;
            }
        }
        return false;
    }
}

function degreeToRadians(degrees) {
    let pi = Math.PI;
    return degrees * (pi / 180);
}

function hex_code_to_luminance(hex_code) {
    let R = parseInt(hex_code.substring(1, 3), 16);
    let G = parseInt(hex_code.substring(3, 5), 16);
    let B = parseInt(hex_code.substring(5, 7), 16);

    return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

