class Data {
    constructor() {
        this.rules = new Rules();
        this.metadata = new MetaData();
        this.full_data = [];
        this.filtered_data = [];
    }

    /**
     * Import the data. Returns a promise that will resolve if the data is correctly imported.
     * If an error occured, the promise is rejected.
     * @param {File} dataFile File that contains data to import
     * @returns {Promise}
     */
    importData(dataFile) {
        let that = this;

        // Reset data
        this.rules = new Rules();
        this.metadata = new MetaData();
        this.full_data = [];
        this.filtered_data = [];

        return new Promise((resolve, reject) => {
            Papa.parse(dataFile, {
                header: true, //data contains header
                download: true, //let parser know that file is located at path_to_data
                dynamicTyping: true, //create ints and such dynamically
                skipEmptyLines: true, //skip empty lines
                complete: function (results) {
                    that.full_data = results.data;
                    that.filtered_data = results.data;
                    that.all_indeces = [...Array(that.full_data.length).keys()];

                    try {
                        that.importFeaturesAndItsValues(results);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                    // Do other stuff
                }
            });
        });
    }

    /**
     * Filter the data according to a given attribute value.
     * @param {Map} criteria in the form {{key:[value]}}
     * @returns {[]}
     */
    filterData(criteria) {
        return this.full_data.filter(function (row) {
            return Array.from(criteria.keys()).every(function (feature) {
                if (feature.isNumeric) {//if numeric, check min and max
                    let inbetween = true;
                    for (let criterion of criteria.get(feature)) {
                        criterion = criterion.split(" ");
                        let equality_sign = criterion[0];
                        let value = parseFloat(criterion[1]);
                        if (equality_sign === "\u2265") {
                            inbetween = row[feature.name] >= value;
                        } else {
                            inbetween = row[feature.name] <= value;
                        }
                        if (!inbetween) {
                            return false;
                        }
                    }
                    return inbetween;
                } else { //if not, check if feature is included in row
                    return criteria.get(feature).includes(row[feature.name]);
                }
            });
        });
    }

    /**
     * Filter the data with regular expressions.
     * @param {Map} criteria in the form {{key:value}}, value should be a regular expression
     * @returns {[]}
     */
    filterDataRegEx(criteria) {
        return this.full_data.filter(function (row) {
            return Array.from(criteria.keys()).every(function (feature) {
                // console.log('criteria: ' + criteria.get(feature));
                // console.log('row: ' + row[feature]);
                // console.log(new RegExp(criteria.get(feature)).test(row[feature]));
                return new RegExp(criteria.get(feature)).test(row[feature]);
            });
        });
    }


    /**
     * Import features and its values in the metadata
     * @param results (the dataset as read by the Papa parser)
     */
    importFeaturesAndItsValues(results) {
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
    }

    /**
     * Import rules of a csv, rules will be stored as an ordered rule list. This method returns a promise that is rejected
     * if the rules could not be imported successfully. If they were correctly imported, the promise is resolved.
     * @param {File} rulesFile File that contains rules to import
     * @returns {Promise}
     */
    importRules(rulesFile) {
        let that = this;
        // Reset rules.
        this.rules =  new Rules();
        return new Promise((resolve, reject) => {
            Papa.parse(rulesFile, {
                download: true, //let parser know that file is located at path_to_rules
                dynamicTyping: true, //create ints and such dynamically
                skipEmptyLines: true, //skip empty lines
                complete: function (results) {
                    // loop through the rules
                    results.data.forEach((row) => {
                        // loop through each row here
                        // split rule in rule and values
                        let splitted_rule_from_values = row[0].split("(");

                        // get values and convert to numbers (false and true positives)
                        let values = splitted_rule_from_values[1].split("/");
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
                            if (isNumeric(label)) {
                                label = parseInt(label);
                            }
                            that.metadata.labels.add(label);
                            let rule;
                            try { //try to create rule
                                rule = new Rule(that.metadata.getFeature("label"), label, true_positives, false_positives); // create rule
                            } catch (e) {
                                reject(e);
                            }

                            let conditions = actual_rule[0]; // get first value, those are the conditions
                            conditions = conditions.split(" and "); // get each condition seperate

                            for (let i = 0; i < conditions.length; i++) {  // loop over all conditions
                                let condition = conditions[i];
                                let contains_equality = false;
                                let equality_sign = "=";
                                let unicode_sign = "=";
                                if (condition.includes('!=') || condition.includes('\u2260')) { //unicode for not equal
                                    equality_sign = "!=";
                                    unicode_sign = '\u2260';
                                    contains_equality = true;
                                } else if (condition.includes('>=') || condition.includes('\u2265')) { //unicode for larger than or equal
                                    equality_sign = ">=";
                                    unicode_sign = '\u2265';
                                    contains_equality = true;
                                } else if (condition.includes('<=') || condition.includes('\u2264')) { //unicode for smaller than or equal
                                    equality_sign = "<=";
                                    unicode_sign = '\u2264';
                                    contains_equality = true;
                                } else if (condition.includes('>')) {
                                    equality_sign = ">";
                                    unicode_sign = '>';
                                    contains_equality = true;
                                } else if (condition.includes('<')) {
                                    equality_sign = "<";
                                    unicode_sign = '<';
                                    contains_equality = true
                                } else if (condition.includes('=')) {
                                    equality_sign = "=";
                                    unicode_sign = '=';
                                    contains_equality = true;
                                }

                                if (!contains_equality && that.metadata.containsAnd) { // condition has been unnecesarily splitted and should be merged with upcoming condition
                                    conditions[i + 1] = condition + " and " + conditions[i + 1];
                                    continue;
                                }

                                condition = condition.replace(unicode_sign, equality_sign);
                                condition = condition.split(` ${equality_sign} `); // split condition in feature and value
                                let feature = condition[0];
                                let value = condition[1];

                                try { // try to create actual Condition
                                    rule.addCondition(that.metadata.getFeature(feature), equality_sign, unicode_sign, value);
                                } catch (e) {
                                    reject(e);
                                }
                            }
                            that.rules.addRule(rule)
                        } else {
                            // remove else and all spaces at start and end
                            let label = actual_rule.replace("else ", "").trim();
                            if (isNumeric(label)) {
                                label = parseInt(label);
                            }
                            that.metadata.labels.add(label);
                            let rule;
                            try { //try to create default rule
                                rule = new Rule(that.metadata.getFeature("label"), label);
                            } catch (e) {
                                reject(e);
                            }
                            that.rules.addRule(rule);
                        }
                    });

                    // We successfully imported the rules.
                    resolve();
                }
            });
        });

    }

    /**
     * Function that orders features according to their strength.
     * Returns the ordering of the feature as they should appear in the DAG
     * @returns {[Feature]} ordered list of feature names
     */
    getOrderingOfFeatures() {
        // Store the feature and its score
        let feature_strength_list = new Map();

        // For each rule, determine the strength
        for (let rule of this.rules.rules) {
            for (let feature of rule.conditions.keys()) {
                let strength = rule.trueInstances / (rule.trueInstances + rule.falseInstances);

                // Store the strength. Strength gets added whenever there is already some value.
                if (!feature_strength_list.has(feature.name)) {
                    feature_strength_list.set(feature.name, strength);
                } else {
                    feature_strength_list.set(feature.name, feature_strength_list.get(feature.name) + strength);
                }

            }
        }
        // Sort the map based on strength score
        const sorted_feature_map = new Map([...feature_strength_list.entries()].sort((a, b) => b[1] - a[1]));

        // We need this reference to be able to use it in the anonymous class below
        let that = this;

        // Convert the map into an array of Feature objects.
        let featureOrder = Array.from(sorted_feature_map, ([featureName, strength]) => {
            return that.metadata.getFeature(featureName);
        });

        // Add the label feature at the back (otherwise we wouldn't have a label).
        featureOrder.push(this.metadata.getFeature("label"));

        // Return this feature ordering.
        return featureOrder;
    }


}

class MetaData {
    /**
     * Create a map of the feature with key the feature name and the object feature as value
     */
    constructor() {
        // Set contains items of the class Feature
        this.features = new Map();
        this.labels = new Set();
        this.containsAnd = false;
    }

    /**
     * Adds feature to metadata
     * @param feature
     */
    addFeature(feature) {
        this.features.set(feature.name, feature);
        if (!this.containsAnd) {
            this.containsAnd = feature.name.includes("and");
        }
    }

    /**
     * Gets feature by feature_name
     * @param {string} feature_name Name of the feature
     */
    getFeature(feature_name) {
        if (this.features.has(feature_name)) { //check if feature name is in the features
            return this.features.get(feature_name);
        } else { //if not, throw an error
            throw new Error(`Feature ${feature_name} does not exist.`);
        }
    }

}

class Feature {
    /**
     * Creates feature of the existing data set
     * @param {string} name string
     * Values is a set of strings
     * isLabel is a boolean to indicate whether the feature is a label (there is at most one such feature)
     */
    constructor(name) {
        this.name = name;
        this.values = new Set();
        this.isLabel = false;
        this.isNumeric = true;
        this.min = Number.MAX_SAFE_INTEGER;
        this.max = Number.MIN_SAFE_INTEGER;
        this.numberOfValues = 0;
    }

    /**
     * Adds a value to the possible values of a feature
     * @param value
     */
    addValue(value) {
        if (value !== "" && value !== null) { //only add value if not empty
            this.values.add(value);
            this.isNumeric = this.isNumerical();
            if (this.isNumeric) {
                if (value < this.min) {
                    this.min = value;
                }
                if (value > this.max) {
                    this.max = value;
                }
            } else {
                this.min = NaN;
                this.max = NaN;
            }

            this.numberOfValues = this.values.size;
        }

    }

    isNumerical() {
        for (let value of this.values) {
            if (parseFloat(value) !== value) {
                return false;
            }
        }
        return true;
    }

}

class Rules {
    /**
     * Stores a ordered decision list
     */
    constructor() {
        /**
         * List of {@link Rule} objects
         * @type {[Rule]}
         */
        this.rules = [];
        this.accuracy = 0;
        this.precision = 0;
        this.recall = 0;
        this.f1_score = 0;
    }

    /**
     * Add a rule, assumption is that rules are pushed in order
     * @param rule
     */
    addRule(rule) {
        this.rules.push(rule);
    }

    /**
     * Get rule by index, rules are sorted
     * @param index
     * @returns {Rule}
     */
    getRule(index) {
        return this.rules[index];
    }

    /**
     * Function that computes the support of a rule.
     * Returns the support value of a rule.
     * @param {Data} all_data all data in the dataset
     */
    calculateSupportAndConf(all_data, metadata) {
        //reset everything to 0
        for (let rule of this.rules) {
            rule.instancesSatisfiedByRules = 0;
            for (let key of rule.perLabelNumberOfInstances.keys()) {
                rule.perLabelNumberOfInstances.set(key, 0);
            }
        }

        let predicted;
        if (all_data) {
            predicted = new Array(all_data.length).fill('NaN');
        }
        if(metadata) {
            var perLabelGroundTruth = new Map();
            for (let label of metadata) {
                perLabelGroundTruth.set(label, 0);
            }
        }

        //loop over all data and check by while rule the data is satisfied
        let numberOfRows = 0;
        outerloop:
            for (let row of all_data) {
                ruleloop:
                    for (let rule of this.rules) {
                        for (let [feature, condition] of rule.conditions.entries()) {
                            if (!condition.meetCondition(row[feature.name])) {
                                continue ruleloop; // rule not satisfied so continue to next rule
                            }
                        }
                        // all values are equal to the rule
                        rule.instancesSatisfiedByRules += 1;
                        rule.perLabelNumberOfInstances.set(row['label'], rule.perLabelNumberOfInstances.get(row['label']) + 1); // increase specific label value
                        predicted[numberOfRows] = rule.label;
                        numberOfRows++;
                        continue outerloop
                    }
            }

        // determine the support and confidence of each rule
        for (let rule of this.rules) {
            rule.setSupportAndConfidence(numberOfRows);
        }

        if (metadata) {
            var perLabelTP = new Map();
            for (let label of metadata) {
                perLabelTP.set(label, 0);
            }


            var perLabelFP = new Map();
            for (let label of metadata) {
                perLabelFP.set(label, 0);
            }

            let true_val;
            let predicted_val;
            for (let i = 0; i < all_data.length; i++) {
                true_val = all_data[i]['label'];
                predicted_val = predicted[i];

                perLabelGroundTruth.set(true_val, perLabelGroundTruth.get(true_val) + 1)

                if (true_val == predicted_val) {
                    perLabelTP.set(true_val, perLabelTP.get(true_val) + 1); // increase specific label value
                } else {
                    perLabelFP.set(predicted_val, perLabelFP.get(predicted_val) + 1); // increase specific label value
                }
            }
        }


        //Calculate statistics
        this.calculateStats(perLabelTP, perLabelFP, perLabelGroundTruth, numberOfRows);

    }

    calculateStats(perLabelTP, perLabelFP, perLabelGroundTruth, noOfPreds) {
        let accuracy = 0;
        let precision = 0;
        let recall = 0;
        let f1_score = 0;

        let truePos = 0;
        let falsePos = 0;

        let labelTP;
        let labelFP;
        let labelGroundTruth;

        for (let label of perLabelTP) {
            truePos += label[1];
        }

        this.accuracy = truePos/noOfPreds;

        precision = 0;

        let perLabelTPArr = Array.from( perLabelTP.values() );
        let perLabelFPArr = Array.from( perLabelFP.values() );
        let perLabelGroundTruthArr = Array.from( perLabelGroundTruth.values() );

        for (let i = 0; i < perLabelTP.size; i++) {
            precision += perLabelTPArr[i]/(perLabelFPArr[i]+perLabelTPArr[i]);
            recall += perLabelTPArr[i]/(perLabelGroundTruthArr[i]);
        }

        precision = precision/perLabelTP.size;
        recall = recall/perLabelTP.size;
        f1_score = 2 * ((precision*recall)/(precision+recall));

        this.precision = precision;
        this.recall = recall;
        this.f1_score = f1_score;
    }
}

class Rule {
    /**
     * Stores a rule with the conditions and the outcome (label) of the rule
     * @param {Feature} labelFeature The feature that represents the outcome (so the label feature)
     * @param {string || float || integer} label The value of the outcome
     * @param {number} trueInstances True positives found for this rule
     * @param {number} falseInstances False positives found for this rule
     * @param {number} support Support of a rule, i.e. percentage of instances to which the condition of the rule applies
     * @param {number} confidence Confidence of a rule, i.e. how accurate the rule is in predicting the correct class
     * for the instances to which the condition of the rule applies
     */
    constructor(labelFeature, label, trueInstances = 0, falseInstances = 0, support = 0, confidence = 0) {
        this.trueInstances = trueInstances;
        this.falseInstances = falseInstances;

        this.perLabelNumberOfInstances = new Map();
        for (let featureName of labelFeature.values) {
            this.perLabelNumberOfInstances.set(featureName, {val: 0});
        }

        this.instancesSatisfiedByRules = trueInstances + falseInstances;


        this.support = support;
        this.confidence = confidence;
        this.conditions = new Map(); //conditions are stored as (feature, condition)
        if (!labelFeature.values.has(label)) { //check if value of label actually exists
            throw new Error(`Label \'${label}\' does not occur in the label set`);
        }
        this.label = label;
    }

    isDefault() {
        return (this.conditions.size === 0)
    }

    /**
     * Adds a condition to this rule
     * @param {Feature} feature Feature to set a condition on
     * @param {string} equality
     * @param {string} unicode_sign
     * @param {string} value Value that the should feature should be
     */
    addCondition(feature, equality, unicode_sign, value) {
        // if (!feature.values.has(value)) { //check whether value belongs to feature
        //     throw new Error(`The value \'${value}\' does not occur in the feature ${feature.name}`);
        // }
        let condition_object = new Condition(feature, equality, unicode_sign, value);
        this.conditions.set(feature, condition_object);
    }

    /**
     * Determine the support and confidence of a function
     * Also set the true and false positives
     * @param number_of_rows
     */
    setSupportAndConfidence(number_of_rows) {
        if (number_of_rows === 0){
            this.support = 0;
        } else {
            this.support = (this.instancesSatisfiedByRules / number_of_rows) * 100; //in percentage
        }
        if (this.instancesSatisfiedByRules === 0) {
            this.confidence = 0;
        } else {
            this.confidence = this.perLabelNumberOfInstances.get(this.label) / this.instancesSatisfiedByRules * 100; //in percentage
        }
        this.trueInstances = this.perLabelNumberOfInstances.get(this.label);
        this.falseInstances = this.instancesSatisfiedByRules - this.trueInstances;
    }

    meetConditions(conditions) {
        let meetsConditions = true;
        for (let [feature, criteria] of conditions.entries()) {
            if (this.conditions.has(feature) && criteria.length > 0){
                if (feature.isNumeric) {//if numeric, check if rule satisfies both conditions
                    let inbetween = true;
                    for (let values of criteria.values()) {
                        values = values.split(" ");
                        let equality_sign = values[0];
                        let value = parseFloat(values[1]);
                        let condition = this.conditions.get(feature);
                        let equality_sign_of_rule = condition.equality;
                        equality_sign = (equality_sign === "\u2265") ? ">=" : "<=";
                        if (equality_sign_of_rule === "="){
                            if (equality_sign === ">=") { //>=
                                inbetween = this.conditions.get(feature.name).value >= value; //value of rule must be smaller than value of condition
                            } else {  //<=
                                inbetween = this.conditions.get(feature.name).value <= value;
                            }
                        } else {
                            if (equality_sign.includes(equality_sign_of_rule)) { //larger than or equal
                                inbetween = true; // if same sign, then rule always satisfies conditions
                            } else {
                                if (equality_sign === ">=") { //>=
                                    inbetween = this.conditions.get(feature).value >= value; //value of rule must be smaller than value of condition
                                } else {  //<=
                                    inbetween = this.conditions.get(feature).value <= value;
                                }
                                if (!inbetween) {
                                    return false;
                                }
                            }
                        }

                    }
                    meetsConditions = inbetween;
                } else { //if not, check if feature is included in row
                    meetsConditions = criteria.includes(this.conditions.get(feature).value); //check if condition value is in filter
                }
            }

            if (!meetsConditions) { //immediately return false if not met
                return false;
            }
        }
        return meetsConditions;
    }

}


class Condition {
    /**
     * @param {Feature} feature Feature to set a condition on
     * @param {string} equality ("===", ">=", ">", "<=", "<", "!==")
     * @param {string} unicode for equality
     * @param {string || float || integer} value Value that feature should be
     */
    constructor(feature, equality, unicode, value) {
        this.feature = feature;
        this.equality = equality;
        this.unicode_equality = unicode;
        this.value = value;
        if (isNumeric(this.value)) {
            this.value = parseFloat(this.value);
        } else {
            this.unicode_equality = "";
        }
    }

    meetCondition(value) {
        if (typeof value === "string" && this.equality !== "=" && this.equality !== "!=") {
            throw new Error(`Cannot compare a string with ${this.equality}.`);
        }
        switch (this.equality) {
            case "=":
                return value === this.value;
            case "!=":
                return value !== this.value;
            case ">":
                return value > this.value;
            case "<":
                return value < this.value;
            case ">=":
                return value >= this.value;
            case "<=":
                return value <= this.value;
        }
    }


}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}