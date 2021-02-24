class Data {
    constructor(path_to_data, path_to_rules) {
        this.path_to_data = path_to_data;
        this.path_to_rules = path_to_rules;
        this.rules = new Rules();
        this.metadata = new MetaData();
    }

    importData() {
        let that = this;
        return new Promise((resolve, reject) => {
            Papa.parse(this.path_to_data, {
                header: true,
                download: true,
                dynamicTyping: true,
                complete: function (results) {
                    that.full_data = results.data;
                    try {
                        that.importAttributesAndValues(results);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                    // that.importRules();
                    // Do other stuff
                }
            });
        });
    }

    importAttributesAndValues(results) {
        //Import features and values
        // loop through the headers, thus the features
        let found_label = false; // keep track whether there is a label
        results.meta['fields'].forEach((feature_name) => {
            let feature = new Feature(feature_name);
            if (feature_name === "label") { //Check if feature is called label, then we store this as a label
                found_label = true;
                feature.isLabel = true;
            }
            this.metadata.addFeature(feature)
        });

        if (!found_label) { //Warn user that there is no label in the dataset
            throw new Error("No label defined in dataset, try setting the column name of the label to 'label'.")
        }

        results.data.forEach((row) => {
            // loop through each row here
            for (let [feature_name, value] of Object.entries(row)) {
                let feature = this.metadata.getFeature(feature_name);
                feature.addValue(value);
            }
        });
        console.log(this);
    }

    importRules() {
        let that = this;
        return new Promise((resolve, reject) => {
            Papa.parse(that.path_to_rules, {
                download: true,
                dynamicTyping: true,
                complete: function (results) {
                    // loop through the rules
                    results.data.forEach((row) => {
                        // loop through each row here
                        // split rule in rule and values
                        let splitted_rule_from_values = row[0].split("(");

                        // get values and convert to numbers (false and true positives)
                        let values = splitted_rule_from_values[1].split("/")
                        let true_positives = parseInt(values[0]);
                        let false_positives = parseInt(values[1]);

                        // get rule
                        let actual_rule = splitted_rule_from_values[0];
                        // check if it is not the default (starts with if)
                        if (actual_rule.startsWith("if")) {
                            // remove if from string
                            actual_rule = actual_rule.replace("if ", "");
                            actual_rule = actual_rule.split(" then ");
                            // get second value of actual rule (that is the label) and remove all start and end spaces.
                            let label = actual_rule[1].trim();
                            let rule;
                            try { //try to create rule
                                rule = new Rule(that.metadata.getFeature("label"), label); // create rule
                            } catch (e) {
                                reject(e);
                            }

                            let conditions = actual_rule[0]; // get first value, those are the conditions
                            conditions = conditions.split(" and "); // get each condition seperate
                            for (let condition of conditions) {  // loop over all conditions
                                condition = condition.split(" = "); // split condition in feature and value
                                let feature = condition[0];
                                let value = condition[1];

                                try { // try to create actual Condition
                                    condition = new Condition(that.metadata.getFeature(feature), value);
                                } catch (e) {
                                    reject(e);
                                }

                                rule.addCondition(condition);
                            }
                            that.rules.addRule(rule)
                        } else {
                            // remove else and all spaces at start and end
                            let label = actual_rule.replace("else ", "").trim();
                            let rule;
                            try { //try to create default rule
                                rule = new Rule(that.metadata.getFeature("label"), label);
                            } catch (e) {
                                reject(e);
                            }
                            that.rules.addRule(rule);
                        }
                    });

                    // Do other stuff
                }
            });
        });

        console.log(this);

    }


}

class MetaData {
    constructor() {
        // Set contains items of the class Feature
        this.features = new Map();
    }

    addFeature(feature) {
        this.features[feature.name] = feature;
    }

    getFeature(feature_name) {
        return this.features[feature_name];
    }

}

// Creates feature of the existing data set
// Stores name as string
// Values is a set of strings
class Feature {
    constructor(name) {
        this.name = name;
        this.values = new Set();
        this.isLabel = false;
    }

    addValue(value) {
        this.values.add(value)
    }
}

//Rules are ordered decision list
class Rules {
    constructor() {
        this.rules = [];
    }

    addRule(rule) {
        this.rules.push(rule);
    }
}

class Rule {
    constructor(label_feature, label) {
        this.conditions = new Set();
        if (!label_feature.values.has(label)) { //check if value of label actually exists
            throw new Error(`Label \'${label}\' does not occur in the label set`);
        }
        this.label = label;
    }

    addCondition(condition) {
        this.conditions.add(condition);
    }

}

class Condition {
    constructor(feature, value) {
        this.feature = feature; // store the feature
        if (!feature.values.has(value)) { //check if value actually appears in the feature
            throw new Error(`The value \'${label}\' does not occur in the feature ${feature.name}`);
        }
        this.value = value;
    }

    satisfiesCondition(value) {
        return (this.value === value)
    }
}

class DAG {

}

class Node {
    // a condition is met if the feature is equal to the value
    constructor(feature, value, true_node, false_node) {

    }
}


