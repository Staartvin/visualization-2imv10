//Get paths to all available datasets
var no_of_available_datasets = 4;
var all_data_names = new Array("Dataset 1", "Dataset 2", "Dataset 3", "Dataset 4")

// Communicate names of available datasets to Control View
ControlView.setAvailableDatasets(all_data_names);

// Load data files
const all_data = new Data("data/Dataset 2/Data.csv", "data/Dataset 2/Rules.csv");
const drawingTool = new Drawing();


// Import data and rules into data structure and then generate a DAG of rules.
all_data.importData()
    .then(() => all_data.importRules())
    .then(() => {
        //Determine Support and Confidence
        all_data.rules.calculateSupportAndConf(all_data.full_data);

        // Communicate feature ordering to rules view
        RulesView.setFeatureOrder(all_data.getOrderingOfFeatures());

        // Communicate rules to the rules view.
        RulesView.setRules(all_data.rules);

        // Draw the checkboxes of the filters
        FilterView.setupSelector();

        // Filter rules for the first time after rules have been loaded.
        FilterView.updateFilteredRules();

    })
    .catch((e) => {
        // console.log(e.toString());
        throw(e);
    });




