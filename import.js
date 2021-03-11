class Data {
    constructor(path_to_data, path_to_rules) {
        this.path_to_data = path_to_data;
        this.path_to_rules = path_to_rules;
        this.rules = new Rules();
        this.metadata = new MetaData();
        this.full_data = [];
        this.all_indeces = [];
        this.DAG = new DAG();
    }

    /**
     * Import the data. Returns a promise that will resolve if the data is correctly imported.
     * If an error occured, the promise is rejected.
     * @returns {Promise}
     */
    importData() {
        let that = this;
        return new Promise((resolve, reject) => {
            Papa.parse(this.path_to_data, {
                header: true, //data contains header
                download: true, //let parser know that file is located at path_to_data
                dynamicTyping: true, //create ints and such dynamically
                complete: function (results) {
                    that.full_data = results.data;
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
     * @returns {Promise}
     */
    importRules() {
        let that = this;
        return new Promise((resolve, reject) => {
            Papa.parse(that.path_to_rules, {
                download: true, //let parser know that file is located at path_to_rules
                dynamicTyping: true, //create ints and such dynamically
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
                                rule = new Rule(that.metadata.getFeature("label"), label, true_positives, false_positives); // create rule
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
                                    rule.addCondition(that.metadata.getFeature(feature), value);
                                } catch (e) {
                                    reject(e);
                                }
                            }
                            let [support, conf] = rule.getRuleSupportAndConf(all_data.full_data);
                            rule.support = support;
                            rule.confidence = conf;

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

                    // We successfully imported the rules.
                    resolve();
                }
            });
        });

    }

    /**
     * Create DAG where each rule is on a line (so no nested rules)
     */
    createSimpleDAG() {
        // order the nodes
        this.orderingOfFeatures = this.getOrderingOfFeatures();
        // create Simple Node is a recursive function, so creating the first node, will recursively create all nodes
        let node = this.createSimpleNode(0, 0);
        // a DAG can be topologically sorted
        this.DAG.topologicallySort();
        // assign the weights according to the data flow
        this.DAG.assignWeights();
    }

    createExtendedDAG() {
        // order the nodes
        this.orderingOfFeatures = this.getOrderingOfFeatures();
        // create Simple Node is a recursive function, so creating the first node, will recursively create all nodes
        let conditions = new Map()
        let node = this.createExtendedNode(0, conditions);
        // a DAG can be topologically sorted
        this.DAG.topologicallySort();
        // assign the weights according to the data flow
        this.DAG.assignWeights();
    }

    /**
     * Each node belongs to a rule
     * For each rule, we loop over the ordered features
     *      We check if a condition with this feature exists in the rule
     *      If so,
     *          We check if the node with the rule, feature and condition already exists,
     *              If so we return this node
     *              IF not we create a new node which has an edge to a true node and a false node
     *                  A true node is a node with the same rule, but which only loops over the remaining features
     *                      That is, the feature index will be +1 of the feature index of the condition
     *                  A false node is a node with the next rule, and will loop over all features again (feature_index = 0)
     *                  If the true and false node are created, the new node is added on the DAG and returned
     *     If not,
     *          Then this node is an outcome node
     *              We check if it exists or we create one and return this after adding it to the DAG.
     *
     * @param {number} rule_index
     * @param {number} feature_index
     * @returns {?Node}
     */
    createSimpleNode(rule_index, feature_index) {
        const rule = this.rules.rules[rule_index]; //request rule belonging to the rule_index
        let isOutcome = true; //outcome is true until condition has been found
        let node_feature;
        let node_value;
        let new_feature_index;
        for (let i = feature_index; i < this.orderingOfFeatures.length; i++) { // loop over the remaining features (features before i are already checked in a previous call))
            const feature = this.orderingOfFeatures[i]; // get the ith feature of the ordered list
            const condition_value = rule.getConditionByFeature(feature); // request condition of this future of the given rule
            if (condition_value !== null) { //If not null, then there exists a condition with this feature
                isOutcome = false; //So there is a still a condition, so not outcome node
                node_feature = feature; //store feature for new node
                node_value = condition_value; //store value for new node
                new_feature_index = i + 1; //already save the index for the upcoming true node
                break;
            }
        }
        if (isOutcome) { //no condition has been found, so this must be the outcome node
            let already_existing_node = this.getNode(rule, this.metadata.getFeature("label"), rule.label);
            if (already_existing_node != null) {
                return already_existing_node; //this outcome node already exists, so return this one
            }
            //outcome does not exist, so we create one
            let node = new Node(this.DAG.getNodes().length, rule, this.metadata.getFeature("label"), rule.label, null, null);
            this.DAG.addNode(node);
            return node;
        } else { //there has been a condition found, so this is a condition node
            let already_existing_node = this.getNode(rule, node_feature, node_value);
            if (already_existing_node != null) {
                return already_existing_node; //this condition node already exists, so return this one
            }
            // condition node does not exist, so create new one
            let true_node = this.createSimpleNode(rule_index, new_feature_index); // create the true node it has an edge to
            let false_node = this.createSimpleNode(rule_index + 1, 0); // create the false node it has an edge to
            let node = new Node(this.DAG.getNodes().length, rule, node_feature, node_value, true_node, false_node); //create the node
            node.computeNodeData(this.full_data, this.all_indeces); //compute node data from the complete data
            this.DAG.addNode(node);
            return node;
        }
    }

    createExtendedNode(rule_index, conditions){
        const rule = this.rules.rules[rule_index]; //request rule belonging to the rule index
        let isOutcome = true; //outcome is true until condition has been found
        let node_feature;
        let node_value;
        let new_feature_index;
        if (rule.satisfiesConditions(conditions)){
            for (let i = 0; i < this.orderingOfFeatures.length; i++) { // loop over the remaining features (features before i are already checked in a previous call))
                const feature = this.orderingOfFeatures[i]; // get the ith feature of the ordered list
                if (conditions.has(feature)){ // condition has already been satisfied by a previous node
                    let value = conditions.get(feature)
                    if (value[0]){ //condition only indicates true (so specific has already been set)
                        continue
                    }
                    if (feature.values.size == 2){
                        continue //it is either true or false, and we already know one of the two
                    }
                }
                // conditions has not been satisfied yet
                const condition_value = rule.getConditionByFeature(feature); // request condition of this future of the given rule
                if (condition_value !== null){ //If not null, then there exists a condition with this feature
                    isOutcome = false; //So there is a still a condition, so not outcome node
                    node_feature = feature; //store feature for new node
                    node_value = condition_value; //store value for new node
                    // new_feature_index = i + 1; //already save the index for the upcoming true node
                    break;
                }
            }
            if (isOutcome){ //no condition has been found, so this must be the outcome node
                // let already_existing_node = this.getNode(rule, this.metadata.getFeature("label"), rule.label);
                // if (already_existing_node != null & rule.isDefault()){
                //     return already_existing_node; //this outcome node already exists, so return this one
                // }
                //outcome does not exist, so we create one
                let node =  new Node(this.DAG.getNodes().length, rule, this.metadata.getFeature("label"), rule.label, null, null);
                this.DAG.addNode(node);
                return node;
            } else { //there has been a condition found, so this is a condition node
                // let already_existing_node = this.getNode(rule, node_feature, node_value); //TODO
                // if (already_existing_node != null){
                //     return already_existing_node; //this condition node already exists, so return this one
                // }
                // condition node does not exist, so create new one
                let true_conditions = new Map(conditions);
                true_conditions.set(node_feature, [true, node_value]);

                let false_conditions = new Map(conditions);
                false_conditions.set(node_feature, [false, node_value]);

                let true_node = this.createExtendedNode(rule_index, true_conditions); // create the true node it has an edge to
                let false_node = this.createExtendedNode(rule_index + 1, false_conditions); // create the false node it has an edge to
                let node = new Node(this.DAG.getNodes().length, rule, node_feature, node_value, true_node, false_node); //create the node
                this.DAG.addNode(node);
                return node;
            }
        } else {
            return this.createExtendedNode(rule_index + 1, conditions)
        }
    }
    /**
     * Get node by rule, feature and value (if this exists, otherwise null)
     * (rule, feature, value) is a primary key of a node
     * @param {Rule} rule
     * @param {Feature} feature
     * @param {string} value of feature
     * @returns {?Node} null if not existing, a node object otherwise
     */
    getNode(rule, feature, value) {
        for (let node of this.DAG.getNodes()) {
            if (node.rule === rule && node.feature === feature && node.value === value) {
                return node;
            }
        }
        return null;
    }

    /**
     * Function that orders features accoring to their strength.
     * Returns the ordering of the feature as they should appear in the DAG
     * @returns {[Feature]} ordered list of feature names
     */
    getOrderingOfFeatures() {
        // Store the feature and its score
        let feature_strength_list = new Map();

        // For each rule, determine the strength
        for (let rule of this.rules.rules) {
            for (let feature of rule.conditions.keys()) {
                let strength = rule.truePositives / (rule.truePositives + rule.falsePositives);

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

class DAG {
    /**
     * Stores the DAG as a ordered list of nodes
     */
    constructor() {
        this.orderedListOfNodes = [];
    }

    /**
     * Get all nodes of the DAG
     * @returns {[Node]} List of nodes
     */
    getNodes() {
        return this.orderedListOfNodes;
    }

    /**
     * Add a node to the DAG
     * @param {Node} node to add
     */
    addNode(node) {
        this.orderedListOfNodes.push(node);
    }

    /**
     * Get the first node of the topological ordering (has no incoming edges)
     * @throws {Error} When there is no root node.
     * @returns {Node} the root node.
     */
    getRootNode() {
        if (this.orderedListOfNodes.length > 0) {
            return this.orderedListOfNodes[0];
        }
        throw new Error("DAG does not contain any nodes yet.")
    }

    /**
     * Get depth of the DAG. The depth of the DAG is longest path we can make from the root node
     * (or any of the nodes that can be accessed from the root following a 'false' edge),
     * following only 'true edges'.
     *
     * @returns {number} The depth of this DAG.
     */
    getDepth() {
        let depth = 0;

        // Start at the root node
        let currentNode = this.getRootNode();
        let firstNodeOfRule = this.getRootNode()

        // Loop over all the left-most nodes of the DAG.
        do {
            // Store the current depth
            let currentDepth = 0;

            // Let's go as deep as we can go following true edges
            while (currentNode.true_node !== undefined && currentNode.true_node !== null) {

                // Obtain the node following the 'true' edge
                currentNode = currentNode.true_node;

                // Dive one deeper
                currentDepth++;
            }

            // Update the depth if we reached a deeper level than we did before.
            depth = Math.max(depth, currentDepth);

            // If there exists another rule we can go to, let's jump to that one.
            if (firstNodeOfRule.false_node !== undefined && firstNodeOfRule.false_node !== null) {
                // Set the current node to the first node the rule
                currentNode = firstNodeOfRule.false_node;
                firstNodeOfRule = currentNode;

                // Reset current depth
                currentDepth = 0;
            }

        } while (firstNodeOfRule.false_node !== undefined && firstNodeOfRule.false_node !== null);

        return depth;
    }

    /**
     * Get the height of this DAG. The height is the maximum number of levels you can go down from the root.
     * @return {number} height of the dag.
     */
    getHeight() {
        let height = 0;

        // Start at the root node
        // let currentNode = this.getRootNode();

        // Loop over all the left-most nodes of the DAG.
        // do {
        //     // Let's go as deep as we can go following false edges
        //     if (currentNode.false_node !== undefined && currentNode.false_node !== null) {
        //
        //         // Obtain the node following the 'false' edge
        //         currentNode = currentNode.false_node;
        //
        //         // Dive one deeper
        //         height++;
        //     }
        // } while (currentNode.false_node !== undefined && currentNode.false_node !== null);

        for (let node of this.orderedListOfNodes){
            if (node.isLabelNode()){
                height++;
            }
        }

        return height;
    }

    /**
     * Sort the DAG topologically, if no such ordering
     * then throw error that this is not a valid DAG.
     * @throws {Error} When the current graph is not a DAG.
     */
    topologicallySort() {
        let top_ord = [];
        let S = this.getNodesWithoutIncomingEdge(top_ord); // set with nodes with no incoming edges

        while (S.length > 0) { //there are nodes with no incoming edges
            let node_id = S.splice(0, 1); //take one node and remove from S
            top_ord.push(node_id[0]);
            S = this.getNodesWithoutIncomingEdge(top_ord); //find new nodes with no incoming edges
        }

        if (top_ord.length === this.orderedListOfNodes.length) { //all nodes can be topologically sorted
            for (let node of this.getNodes()) {
                node.id = top_ord.indexOf(node.id); //set id to topological ordering id
            }
            this.orderedListOfNodes.sort(this.compareNodes); //sort the nodes in the DAG topologically ordered
        } else { //Not all nodes are sorted, so graph must contain a cycle
            throw new Error("Graph constructed is not a DAG");
        }
    }

    /**
     * Determine the remaining nodes with no incoming edges discounting the given nodes
     * @param {[number]} L list of integers (contains id of already sorted nodes, those should be discounted)
     * @returns {[Node]} A list of nodes with no incoming edges
     */
    getNodesWithoutIncomingEdge(L) {
        let S = []; //set of nodes with no incoming edges
        for (let i = 0; i < this.orderedListOfNodes.length; i++) {
            S.push(i);
        }
        for (let node of this.orderedListOfNodes) {
            if (L.includes(node.id)) { //discount the nodes that are already toplogically sorted
                let index = S.indexOf(node.id);
                if (index !== -1) { //remove element from S
                    S.splice(index, 1);
                }
                continue; //continue to next loop
            }
            if (node.true_node != null) { //check if there is a true node, if so then there is an edge to this true node
                let index = S.indexOf(node.true_node.id);
                if (index !== -1) { //remove node from S (there is an edge to this node)
                    S.splice(index, 1);
                }
            }
            if (node.false_node != null) { //check if there is a false node, if so then there is an edge to this true node
                let index = S.indexOf(node.false_node.id);
                if (index !== -1) { //remove node from S (there is an edge to this node)
                    S.splice(index, 1);
                }
            }
        }
        return S; //return the set consisting of nodes without incoming edges, discounting L
    }


    /**
     * Compare nodes topologically, so node with smaller id should become before node with larger id
     * @param {Node} nodeA
     * @param {Node} nodeB
     * @returns {number}
     */
    compareNodes(nodeA, nodeB) {
        if (nodeA.id < nodeB.id) {
            return -1;
        }
        if (nodeA.id > nodeB.id) {
            return 1;
        }
        return 0;
    }

    /**
     * TODO implement this function
     * Function that assigns weights to the edges according to the data flow
     */
    assignWeights() {

    }
}

class Node {
    /**
     * Stores all attributes of a node
     * @param {number} id integer
     * @param {Rule} rule object
     * @param {Feature} feature object
     * @param {string} value string
     * @param {Node} true_node node object
     * @param {Node} false_node node object
     */
    constructor(id, rule, feature, value, true_node, false_node) {
        this.id = id; //the nth node in the DAG (topological ordered)
        this.rule = rule; //the rule under consideration in this node
        this.feature = feature; //the specific feature that should be satisfied
        this.value = value; // the value of the feature that should be satisfied
        this.true_node = true_node;
        this.weight_to_true_node = 1;
        this.false_node = false_node;
        this.weight_to_false_node = 1;
        this.node_data = new NodeData();
    }

    /**
     * Check whether this node is a leaf of the DAG, so final node
     * @returns {boolean}
     */
    isLabelNode() {
        return (this.feature.isLabel);
    }

    /**
     * Computes the part of the data that is satisfied in this node.
     * @param {Array} all_data all data we have
     * @param {Array} all_indeces an array with range(data_size)
     */
    computeNodeData(all_data, all_indeces) {

        let feature_name = this.feature.name; //get the name of the feature that is checked in this node
        let values = []

        //We need to find the values that are checked for in this Node. Hence we store the values.
        //This is an array so that if there are OR conditions for different values of the same feature
        //we don't miss it
        for (let [key, value] of this.rule.conditions.entries()) {
            if (key.name === feature_name){
                values.push(value);
                break; //quick break to avoid redundant iterations
            }
        }

        //for all values, we need to extract the index of the data that satisfies the condition of the node
        //for efficiency we store the row indeces of the data
        for(let val of values){
            var indeces = all_data.map((e, i) => e[feature_name] === val ? i : '').filter(String);
        }

        let neg_indeces = Array.from($(all_indeces).not(indeces)) //we store the negative indeces so that we only
                                                                  //do this inefficient operation once. We use set
                                                                  //difference for this operation.

        //set the properties of the NodeData class as computed
        this.node_data.positiveRows = indeces;
        this.node_data.noOfPosRows = indeces.length;
        this.node_data.negativeRows = neg_indeces;
        this.node_data.noOfNegRows = neg_indeces.length;

    }
}

/**
 * Stores data that will be used in the DAG for data flow between nodes.
 * {{number}} positiveRows List of integers that satisfy the feature in this node
 * {{number}} negativeRows List of integers that do not satisfy the feature in this node
 * {number} noOfPosRows integer length of the positive row array. (Note that this is not the same with true
 *                                     positives of the rule)
 * {number} noOfNegRows integer length of the negative row array. (Note that this is not the same with false
 *                                     positives of the rule)
 */
class NodeData {
    /**
     * Stores data that will be used in the DAG for data flow between nodes.
     */
    constructor() {
        this._positiveRows = [];
        this._negativeRows = [];
        this._noOfPosRows = 0;
        this._noOfNegRows = 0;
    }

    //Getter and setter methods
    get positiveRows() {
        return this._positiveRows;
    }

    set positiveRows(value) {
        this._positiveRows = value;
    }

    get negativeRows() {
        return this._negativeRows;
    }

    set negativeRows(value) {
        this._negativeRows = value;
    }

    get noOfPosRows() {
        return this._noOfPosRows;
    }

    set noOfPosRows(value) {
        this._noOfPosRows = value;
    }

    get noOfNegRows() {
        return this._noOfNegRows;
    }

    set noOfNegRows(value) {
        this._noOfNegRows = value;
    }
}

class MetaData {
    /**
     * Create a map of the feature with key the feature name and the object feature as value
     */
    constructor() {
        // Set contains items of the class Feature
        this.features = new Map();
    }

    /**
     * Adds feature to metadata
     * @param feature
     */
    addFeature(feature) {
        this.features.set(feature.name, feature);
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
    }

    /**
     * Adds a value to the possible values of a feature
     * @param value
     */
    addValue(value) {
        this.values.add(value)
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
}

class Rule {
    /**
     * Stores a rule with the conditions and the outcome (label) of the rule
     * @param {Feature} labelFeature The feature that represents the outcome (so the label feature)
     * @param {string} label The value of the outcome
     * @param {number} truePositives True positives found for this rule
     * @param {number} falsePositives False positives found for this rule
     * @param {number} support Support of a rule, i.e. percentage of instances to which the condition of the rule applies
     * @param {number} confidence Confidence of a rule, i.e. how accurate the rule is in predicting the correct class
     * for the instances to which the condition of the rule applies
     */
    constructor(labelFeature, label, truePositives = 0, falsePositives = 0, support = 0, confidence = 0) {
        this.truePositives = truePositives;
        this.falsePositives = falsePositives;
        this.support = support;
        this.confidence = confidence;
        this.conditions = new Map(); //conditions are stored as (feature, value)
        if (!labelFeature.values.has(label)) { //check if value of label actually exists
            throw new Error(`Label \'${label}\' does not occur in the label set`);
        }
        this.label = label;
    }

    isDefault(){
        return (this.conditions.size === 0)
    }

    /**
     * Adds a condition to this rule
     * @param {Feature} feature Feature to set a condition on
     * @param {string} value Value that the should feature should be
     */
    addCondition(feature, value) {
        if (!feature.values.has(value)) { //check whether value belongs to feature
            throw new Error(`The value \'${value}\' does not occur in the feature ${feature.name}`);
        }
        this.conditions.set(feature, value);
    }

    /**
     * Get specific condition of rule by feature if existing, otherwise null
     * @param {Feature} feature The feature to grab
     * @returns {?string} returns the value of the condition belonging to that feature if existing
     */
    getConditionByFeature(feature) {
        if (this.conditions.has(feature)) {
            return this.conditions.get(feature);
        } else {
            return null;
        }
    }

    /**
     * Checks whether rule is satisfied by conditions
     * @param conditions Map with key: feature, value: list of a boolean (indicates equal or not) and a string (the value)
     * @returns {boolean}
     */
    satisfiesConditions(conditions){
        for (let [feature, value] of conditions){
            let equal = value[0];
            let feature_value = value[1]
            if (this.conditions.has(feature)){ //check if this rule has this feature
                if (equal){
                    if (feature_value !== this.conditions.get(feature)){ //if not equal, then not satisfied
                        return false
                    }
                } else {
                    if (feature_value === this.conditions.get(feature)){ //if not equal, then not satisfied
                        return false
                    }
                }
            }
        }
        return true //all conditions are satisfied by the rule
    }

    /**
     * Function that computes the support of a rule.
     * Returns the support value of a rule.
     * @param {Data} all_data all data in the dataset
     * @returns {number} support Support value of the rule
     */
    getRuleSupportAndConf(all_data) {
        let support = 0;
        let confidence = 0;
        let index_arr_supp = [];
        let index_arr_conf = [];
        let val_ind = 0;


        for (let [feature, value] of this.conditions.entries()) {

            if (index_arr_supp.length == 0 && val_ind == 0) {
                index_arr_supp = all_data.map((e, i) => e[feature.name] === value ? i : '').filter(String);
                index_arr_conf = all_data.map((e, i) => (e[feature.name] === value && e["label"] === this.label) ? i : '').filter(String);
                val_ind +=1;
                continue;
            } else if (index_arr_supp.length == 0 && val_ind != 0) {
                break;
            }
            let curr_ind_arr_supp = all_data.map((e, i) => e[feature.name] === value ? i : '').filter(String);
            let curr_ind_arr_conf = all_data.map((e, i) => ( e[feature.name] === value && e["label"] === this.label) ? i : '').filter(String);

            index_arr_supp = index_arr_supp.filter(value => curr_ind_arr_supp.includes(value));
            index_arr_conf = index_arr_conf.filter(value => curr_ind_arr_conf.includes(value));

            val_ind += 1;
        }

        support = ((index_arr_supp.length*100) / all_data.length);
        confidence = ((index_arr_conf.length*100) / index_arr_supp.length)

        return [support, confidence];
    }

    // /**
    //  * Function to filter data by a specific attribute sample
    //  * Returns filtered number of true_positives and false positives.
    //  * @param {Data} all_data all_data under consideration
    //  * @returns {{number}} true_positives, false positives as the filtered values
    //  */
    // setAttributeValue(all_data, criteria) {
    //     return (all_data.filter(function(obj) {
    //         return Object.keys(criteria).every(function(c) {
    //             return obj[c] == criteria[c];
    //         });
    //     }));
    //
    // }
}
