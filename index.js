const all_data = new Data("data/Data.csv", "data/RulesSample.csv");
all_data.importData().then(() => all_data.importRules()).then(() => all_data.createSimpleDAG()).catch((e) => {
    // console.log(e.toString());
    throw(e);
});


const structural = (sketch) => {

    let canvas;

    sketch.setup = () => {

        // We draw an initial canvas.
        canvas = sketch.createCanvas(sketch.windowWidth / 3, sketch.windowHeight / 2);

        canvas.background(255);
        canvas.position(0, 0);

        sketch.drawBorder();
    }

    sketch.draw = () => {

        // Draw something


    }

    sketch.drawBorder = () => {
        sketch.stroke("#C59EAE");
        sketch.strokeWeight(4);
        sketch.rect(0, 0, sketch.width, sketch.height);
    }

}

const node = (sketch) => {

    let canvas;

    sketch.setup = () => {

        // We draw an initial canvas.
        canvas = sketch.createCanvas(sketch.windowWidth / 3, sketch.windowHeight / 2);

        canvas.background(255);
        canvas.position(0, sketch.windowHeight / 2);

        sketch.drawBorder();
    }

    sketch.draw = () => {

        // Draw something


    }

    sketch.drawBorder = () => {
        sketch.stroke("#9AA6AB");
        sketch.strokeWeight(4);
        sketch.rect(0, 0, sketch.width, sketch.height);
    }

}

const detailed = (sketch) => {

    let canvas;

    sketch.setup = () => {

        sketch.frameRate(60);

        // We draw an initial canvas.
        canvas = sketch.createCanvas(sketch.windowWidth / 2, sketch.windowHeight);

        canvas.background(144);
        canvas.position(sketch.windowWidth / 3, 0);

        sketch.drawBorder();
    }

    sketch.draw = () => {

        // Draw something
        if (sketch.mouseIsPressed) {
            sketch.point(sketch.mouseX, sketch.mouseY, 2)
        }

    }

    sketch.drawBorder = () => {
        sketch.stroke("#FFC114");
        sketch.strokeWeight(4);
        sketch.rect(0, 0, sketch.width, sketch.height);
    }

}

const filter = (sketch) => {

    let canvas;

    sketch.setup = () => {

        // We draw an initial canvas.
        canvas = sketch.createCanvas(sketch.windowWidth / 6, sketch.windowHeight / 2);

        canvas.background(255);
        canvas.position(5 * (sketch.windowWidth / 6), 0);

        sketch.drawBorder();
    }

    sketch.draw = () => {

        // Draw something


    }

    sketch.drawBorder = () => {
        sketch.stroke("#181818");
        sketch.strokeWeight(4);
        sketch.rect(0, 0, sketch.width, sketch.height);
    }

}

const info = (sketch) => {

    let canvas;

    sketch.setup = () => {

        // We draw an initial canvas.
        canvas = sketch.createCanvas(sketch.windowWidth / 6, sketch.windowHeight / 2);

        canvas.background(255);
        canvas.position(5 * (sketch.windowWidth / 6), sketch.windowHeight / 2);

        sketch.drawBorder();
    }

    sketch.draw = () => {

        // Draw something


    }

    sketch.drawBorder = () => {
        sketch.stroke("#272727");
        sketch.strokeWeight(4);
        sketch.rect(0, 0, sketch.width, sketch.height);
    }

}

let structuralView = new p5(structural);
let nodeView = new p5(node);
let detailedView = new p5(detailed);
let filterView = new p5(filter);
let infoView = new p5(info);
