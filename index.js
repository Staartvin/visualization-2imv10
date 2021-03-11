// Load data files
const all_data = new Data("data/Data.csv", "data/Rules.csv");
const drawingTool = new Drawing();


// Import data and rules into data structure and then generate a DAG of rules.
all_data.importData()
    .then(() => all_data.importRules())
    .then(() => all_data.createSimpleDAG())
    .then(() => {
        console.log("Created DAG!");

        // Communicate feature ordering to rules view
        RulesView.setFeatureOrder(all_data.getOrderingOfFeatures());

        // Communicate features to Control View

        ControlView.setFeatures(all_data.metadata.features.keys());

        // Communicate rules to the rules view.
        RulesView.setRules(all_data.rules);

    })
    .catch((e) => {
        // console.log(e.toString());
        throw(e);
    });




