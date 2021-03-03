// Load data files
const all_data = new Data("data/Data.csv", "data/RulesSample.csv");
const drawingTool = new Drawing();


// Import data and rules into data structure and then generate a DAG of rules.
all_data.importData()
    .then(() => all_data.importRules())
    .then(() => all_data.createSimpleDAG())
    .then(() => {
        console.log("Created DAG!");

        StructuralView.setDagData(all_data.DAG);

        let featureOrder = all_data.getOrderingOfFeatures();

        StructuralView.setFeatureOrder(featureOrder);

    })
    .catch((e) => {
        // console.log(e.toString());
        throw(e);
    });




