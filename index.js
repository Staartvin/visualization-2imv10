// Load data files
const all_data = new Data("data/Dataset 4/Data.csv", "data/Dataset 4/Rules.csv");
const drawingTool = new Drawing();


// Import data and rules into data structure and then generate a DAG of rules.
all_data.importData()
    .then(() => all_data.importRules())
    .then(() => {
        //Determine Support and Confidence
        all_data.rules.calculateSupportAndConf(all_data.full_data);

        // Communicate feature ordering to rules view
        RulesView.setFeatureOrder(all_data.getOrderingOfFeatures());

        // Communicate features to Control View
        ControlView.setFeatures(all_data.metadata.features.keys());

        // Communicate rules to the rules view.
        RulesView.setRules(all_data.rules);

        // Draw the checkboxes of the filters
        FilterView.setupSelector();

    })
    .catch((e) => {
        // console.log(e.toString());
        throw(e);
    });




