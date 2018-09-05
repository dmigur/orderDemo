'use strict';

ittelApp.controller('mainController', function ($scope, $timeout, assetsService, jiraService, $http, $q, COUNTRIES) {

    console.log("main controller : assetsService = " + assetsService);

    var defaultTypeSortField = "name";
    var defaultItemSortField = "name";
    var defaultHistoryOrderField = "timestamp";

    $scope.COUNTRIES = COUNTRIES;

    $scope.orderpage = {
        typeField: defaultTypeSortField,
        itemField: defaultItemSortField
    }
    $scope.settings = null;
    $scope.historyFilter = null;

    $scope.currentHistoryFilter = "ALL";
    $scope.managers = [];
    $scope.allManagers = [];
    $scope.orderResult = null;

    $scope.historyOrderField = defaultHistoryOrderField;
    $scope.itemReverseSort = false;
    $scope.typeReverseSort = false;

    $scope.startItemIndex = 0;
    $scope.startTypeIndex = 0;
    $scope.typerecord = null;
    $scope.items = [];
    $scope.basket = [];
    $scope.types = [];
    $scope.supportEmails = new Map();
    $scope.supportEmail = null;

    $scope.makeOrder = false;
    $scope.order = [];
    $scope.orderItems = [];
    $scope.allitems = [];

    // currrent assets uds
    $scope.idSelectedType;
    $scope.idSelectedItem;
    $scope.itemManager = null;

    ///////////////////
    var TypeNameReg = /^([a-z]+.+)$/i;
    var ItemNameReg = /^([a-z]+.+)$/i;
    var ItemDescReg = /^[.+]{3,100}$/i;
    var maxNameLength = 45;
    var minNameLength = 3;

    $scope.authUser = null;

    $scope.show = {
        itemNumber: 100,
        typeNumber: 100
    };
    var MAX_ORDER_ITEMS = 99;

    $scope.country = null;
    $scope.orderTypeId = null;
    $scope.orderItemId = null;


    var jira_url = "";
    var Errors = {
        CREATE_ORDER_ERROR: "Unable to create order",
        JIRA_AUTH_ERROR: "Jira authentication error",
        CANNOT_GET_TYPE_RECORDS: "Unable to get type records",
        CANNOT_GET_ITEM_RECORDS: "Unable to get item records",
        TYPE_NOT_SAVED: "Type not saved",
        TYPE_NOT_UPDATED: "Type not updated",
        TYPE_RECORDS_NOT_UPDATED: "Type records not updated",
        TYPE_NOT_DELETED: "Type not deleted",
        TYPE_ALREADY_EXISTS: "Record already exists",
        TYPE_QUERY_ERROR: "Unable to query type",

        ITEM_NOT_FOUND: "Item not found",
        ITEM_QUERY_ERROR: "Unable to query item",
        ITEM_ALREADY_EXISTS: "Item already exists",
        ITEM_NOT_SAVED: "Item not saved",
        ITEM_NOT_UPDATED: "Item not updated",
        ITEM_NOT_DELETED: "Item not deleted"

    };

    var Status = {
        Welcome: "Welcome to Tallink IT Tellimus!",
        Saved: "Successfully saved",
        Updated: "Successfully updated",
        Deleted: "Successfully deleted",
        Error: "Error"
    };

    var RecordStatus = {
        //&#10004;
        Exists: "Exists",
        Unknown: "Unknown",
        NotExists: "NotExists",
        Error: "Error"
    };

    var RecordClientState = {
        Default: 0,
        New: 0x1,
        Edit: 0x2,
        JustAdded: 0x4
    };

    $scope.view_tab = "orders";

    $scope.errorMessage = null;
    $scope.error = null;
    $scope.addedItemName = null;
    $scope.addedTypeName = null;

    $scope.statusMessage = null;
    $scope.itemfilter = null;
    $scope.typefilter = null;

    var domainReg = /^([a-z0-9]+\.)?[a-z0-9\u00C0-\u017F][a-z0-9\u00C0-\u017F-]*\.[a-z-]{2,}$/i;

    var focused_object;

    $("table").focus(function(){focused_object = this;})


    var makeTypeSort = function () {

        var name = $scope.orderpage.typeField;

        if (!name) {
            return;
        }

        try {
            var sortname = $scope.typeReverseSort ? "-" + name : name;
            $scope.types.sort(dynamicSort(sortname));

        } catch (e) {
            console.log("sorting error");
        }
    }

    var findNewItemRecord = function () {
        var res = null;
        for (var i = 0; i < $scope.items.length; i++) {
            var rec = $scope.items[i];
            if (rec.state & RecordClientState.New) {
                res = rec;
                break;
            }
        }
        return res;
    }

    var findNewTypeRecord = function () {
        var res = null;
        for (var i = 0; i < $scope.types.length; i++) {
            var rec = $scope.types[i];
            if (rec.state & RecordClientState.New) {
                res = rec;
                break;
            }
        }
        return res;
    }

    var findNewItemRecordIndex = function () {

        var res = -1;

        for (var i = 0; i < $scope.items.length; i++) {
            var rec = $scope.items[i];
            if (rec.state & RecordClientState.New) {
                res = i;
                break;
            }
        }

        return res;
    }
    var findNewTypeRecordIndex = function () {

        var res = -1;
        for (var i = 0; i < $scope.types.length; i++) {
            var rec = $scope.types[i];
            if (rec.state & RecordClientState.New) {
                res = i;
                break;
            }
        }
        return res;
    }

    var findOrderIndex = function (id) {
        var res = -1;
        for (var i = 0; i < $scope.order.length; i++) {
            var rec = $scope.order[i];
            if (rec.id == id) {
                return i;
            }
        }
        return res;
    }




    var restoreCursor = function () {
        document.body.style.cursor = "auto";
    }

    var setWaitCursor = function () {
        document.body.style.cursor = "wait";
    }

    var setLoading = function () {

        $("#loading").css("display", "block");
    }

    var stopLoading = function () {
        $("#loading").css("display", "none");
    }


    var getItemRecordByName = function (name) {
        if (!$scope.items) return null;
        if (!name) return null;
        name = name.trim();
        var res = $scope.items.filter(el => el.name == name && el.state != RecordClientState.New)
        return res.length > 0 ? res[0] : null;
    }

    var getManagersByCountry = function (id) {

        return $scope.allManagers.filter(el => el.country == id );

    }

    var getManagerFullNameByShortName = function (name) {

        var res = $scope.allManagers.filter(el => el.jiraName == name);

        return res ? res[0].fullName: "";

    }

    var getManagerNameByShortName = function (name) {

        var res = $scope.allManagers.filter(el => el.jiraName == name);

        return res ? res[0].name: "";

    }

    var checkUniqueTypeRecord = function(item) {
        if (!item) return false;

        if (!$scope.types) return false;
        var name = item.name.trim();

        var res = $scope.types.filter(el => el.name == name && el.id != item.id);
        return res.length == 0 ;
    }

    var checkUniqueItemRecord = function(item) {

        if (!item) return false;

        if (!$scope.items) return false;
        var name = item.name.trim();

        var res = $scope.items.filter(el => el.name == name && el.id != item.id);
        return res.length == 0 ;
    }

    var getTypeRecordByName = function (name) {
        if (!$scope.types) return null;
        if (!name) return null;
        name = name.trim();

        var res = $scope.types.filter(el => el.name == name && el.state != RecordClientState.New)
        return res.length > 0 ? res[0] : null;
    }

    var adjustItemPosition = function (name) {

        if (name == null) {
            return;
        }

        var rec = getItemRecordByName(name);

        if (rec == null) {
            return;
        }

        rec.state |= RecordClientState.JustAdded;

        $scope.startItemIndex = 0;
        var index = rec.id;
        var page = Math.ceil(index / $scope.show.itemNumber) - 1;
        $scope.startItemIndex = page * $scope.show.itemNumber;

    };

    var adjustTypePositionForRecord = function (name) {

        if (name == null) {
            return;
        }

        var rec = getTypeRecordByName(name);

        if (rec == null) {
            return;
        }

        if (defaultTypeSortField != $scope.orderpage.typeField) {
            makeTypetSort();
        }
        rec.state |= RecordClientState.JustAdded;

        $scope.startTypeIndex = 0;
        var index = rec.id;
        var page = Math.ceil(index / $scope.show.typeNumber) - 1;
        $scope.startTypeIndex = page * $scope.show.typeNumber;

    };


    var clearMessages = function () {

        $scope.error = null;
        $scope.errorMessage = null;
        $scope.statusMessage = null;
        $scope.addedItemName = null;
        $scope.addedTypeName = null;
    };


    $scope.onChangeHistoryFilter = function () {

        console.log("filter = " + $scope.currentHistoryFilter);

        $scope.updateActionHistory();

    }


    $scope.recordStyle = function (index) {

        var style = null;

        if (index % 2 == 0) {
            style = "background-color: #c0cbe2;";
        } else {
            style = "background-color: #e2edff;";
        }
        return style;
    }







    $scope.onHistorySort = function (name) {
        $scope.historyReverseSort = $scope.historyOrderField == null ? false : !$scope.historyReverseSort;
        $scope.historyOrderField = name;
        makeHistorySort();
    }

    $scope.onAddItemRecord = function () {
        console.log("adding item rec");

        var id = getItemMaxRecordId() + 1;
        $scope.items.push({
            id: id,
            name: '',
            description: '',
            needApprove: false,
            typeId: $scope.idSelectedType,
            state: RecordClientState.New

        });

        adjustItemPositionForAddition();
        var inputName = "#name" + id;

        waitForElementToDisplay(inputName, 200, setElementFocus);

        waitForElementToDisplay(inputName, 200, function () {
            $(inputName).attr("placeholder", "Enter name here");
        });

        var descCtrl = "#description" + id;
        waitForElementToDisplay(descCtrl, 100, function () {
            $(descCtrl).attr("placeholder", "Enter description here");
        });

        return false;
    }

    $scope.onAddTypeRecord = function () {
        console.log("adding Type rec");
        clearMessages();
        var id = getTypeMaxRecordId() + 1;
        $scope.types.push({
            id: id,
            name: '',
            description: '',
            state: RecordClientState.New
        });

        adjustTypePositionForAddition();
        var inputName = "#tname" + id;

        waitForElementToDisplay(inputName, 400, setElementFocus);

        waitForElementToDisplay(inputName, 200, function () {
            $(ctrl).focus();
            $(ctrl).attr("placeholder", "Enter name here");
        });

        return false;
    }

    $scope.isTypeUpdateState = function (id) {
        var rec = getTypeRecord(id);
        return rec != null && (!rec.state & RecordClientState.New);
    }

    $scope.isItemUpdateState = function (id) {
        var rec = getItemRecord(id);
        return rec != null && (!rec.state & RecordClientState.New);
    }


    $scope.isTypeDeleteAllowed = function (id) {
        var rec = getTypeRecord(id);
        return rec != null && (rec.state & RecordClientState.Edit);
    }

    $scope.isItemDeleteAllowed = function (id) {
        var rec = getItemRecord(id);
        return rec != null && (rec.state & RecordClientState.Edit);
    }

    var checkTypeName = function(name){

        if (!name) return false;

        name = name.trim();
        if (name.length > maxNameLength ||
            name.length < minNameLength) {
            return false;
        }

        if (!name.match(TypeNameReg)) {
            return false;
        }
        return true;
    }

    var checkItemName = function(name){

        if (!name) return false;

        name = name.trim();

        if (name.length > maxNameLength ||
            name.length < minNameLength) {
            return false;
        }

        if (!name.match(ItemNameReg)) {
            return false;
        }
        return true;
    }

    $scope.isTypeNameSaveDisabled = function (id) {
        var res = false;

        var rec = getTypeRecord(id);

        if (!rec) return false;

        var name = rec.name;
        if (!checkTypeName(name)) return true;

        return false;

    }


    $scope.isItemNameSaveDisabled = function (id) {
        var res = false;
        var rec = getItemRecord(id);
        if (!rec) return false;

        var name = rec.name;
        if (!checkItemName(name)){
            return true;
        }
        return false;

    }

    $scope.isItemDescSaveDisabled = function (id) {
        var res = false;
        var rec = getItemRecord(id);
        if (!rec) return false;

        if (!rec.description) return true;

        var name = rec.description.trim();

        if (!name) return true;

        if (!name.match(ItemDescReg)) {
            return true;
        }

        return false;
    }

    $scope.isTypeEditState = function (id) {
        var res = false;
        var rec = getTypeRecord(id);
        if (rec.state != null) {
            if (rec.state & RecordClientState.New) {
                /*
                 var name = rec.name;
                 if (!checkUniqueTypeRecordByName(id, name)) {
                 $scope.error = Errors.ITEM_ALREADY_EXISTS;
                 $scope.errorMessage = name + " : " + Errors.ITEM_ALREADY_EXISTS;
                 return res;
                 }
                 */
                res = true;
            } else if (rec.state & RecordClientState.Edit) {
                res = true;
            }
        }
        return res;
    }

    $scope.isItemEditState = function (id) {
        var res = false;
        var rec = getItemRecord(id);
        if (rec.state != null) {
            if (rec.state & RecordClientState.New) {
                var name = rec.name;

                res = true;

            } else if (rec.state & RecordClientState.Edit) {
                res = true;
            }
        }
        return res;
    }

    $scope.isTypeNameEditAllowed = function (id) {
        var rec = getTypeRecord(id);
        return rec != null && (rec.state & RecordClientState.New || rec.state & RecordClientState.Edit);
    }


    $scope.isItemNameEditAllowed = function (id) {
        var rec = getItemRecord(id);
        return rec != null && (rec.state & RecordClientState.New || rec.state & RecordClientState.Edit);
    }


    $scope.statusStyle = function (status) {

        var style = null;
        if (status == RecordStatus.Exists) {
            style = "color: darkGreen; font-size: 1.2em";
        } else if (status == RecordStatus.Unknown) {
            style = "color: gold;";
        } else if (status == RecordStatus.NotExists) {
            style = "color: darkRed;";
        } else if (status == RecordStatus.Error) {
            style = "color: darkRed;";
        }

        return style;
    }



    var setElementFocus = function (element) {

        if (element.length) {
            element.get(0).focus();
        }

    }

    function waitForElementToDisplay(selector, time, callback) {

        window.setTimeout(function () {
            if ($(selector).length) {
                callback($(selector));
            } else {
                waitForElementToDisplay(selector, time, callback);
            }
        }, time)
    }

    $scope.onDeleteOrderItem = function (id) {

        var index = findOrderIndex(id);

        if (index >= 0) {
            console.log("removing basket item at " + index);
            $scope.order.splice(index, 1);
        }

        // $scope.makeOrder = false;

        //($scope.order.length == 0);
    }

    $scope.onDeleteItem = function (id) {

        var rec = getItemRecord(id);

        doConfirm("Delete record " + rec.name + " ?", function yes() {

            clearMessages();

            assetsService.deleteItem(rec).then(function (result) {
                var res = result;
                if (!res) {
                    console.log("No result");
                    return;
                }

                if (res.status == Status.Error) {

                    console.log("Error, item not deleted: " + rec.name);
                    $scope.error = Errors.ITEM_NOT_DELETED;
                    $scope.errorMessage = res.message ? res.message :
                        (rec.name + ": " + Errors.ITEM_NOT_DELETED);

                    return;
                }

                $scope.statusMessage = rec.name + " : " + Status.Deleted;

                $scope.updateClientRecords();
                setSelectedType($scope.idSelectedType);


            }, function (errpr) {

                console.log("Item not deleted");
                $scope.error = Errors.ITEM_NOT_DELETED;
                $scope.errorMessage = error && error.message ? error.message : Errors.ITEM_NOT_DELETED;

            });
        });
    }

    $scope.onDeleteType = function (id) {

        var rec = getTypeRecord(id);

        doConfirm("Delete type record " + rec.name + " ?", function yes() {

            clearMessages();

            assetsService.deleteType(rec).then(function (result) {
                var res = result;
                if (!res) {
                    console.log("No result");
                    return;
                }

                if (res.status == Status.Error) {

                    console.log("Error, Type record not deleted: " + rec.name);
                    $scope.error = Errors.TYPE_NOT_DELETED;
                    $scope.errorMessage = res.message ? res.message :
                        (rec.name + ": " + Errors.TYPE_NOT_DELETED);

                    return;
                }

                $scope.statusMessage = rec.name + " : " + Status.Deleted;

                $scope.updateClientRecords();

            }, function (errpr) {

                console.log("Type record not deleted");
                $scope.error = Errors.TYPE_NOT_DELETED;
                $scope.errorMessage = error && error.message ? error.message : Errors.TYPE_NOT_DELETED;

            });
        });
    }

    $scope.isShowTypeRecord = function (index) {
        return index >= $scope.startTypeIndex && index < $scope.startTypeIndex + $scope.show.typeNumber;
    }

    $scope.isShowItemRecord = function (index) {

        return index >= $scope.startItemIndex && index < $scope.startItemIndex + $scope.show.itemNumber;

    }

    $scope.isShowHistoryRecord = function (index) {
        return true;
    }

    $scope.isItemDeleteState = function (id) {
        var rec = getItemRecord(id);
        return rec != null && (rec.state & RecordClientState.Edit);
    }



    $scope.isItemEditableInputDisabled = function (id) {
        var rec = getItemRecord(id);
        return rec == null || !(rec.state & RecordClientState.Edit || rec.state & RecordClientState.New);

    }

    $scope.isTypetEditableInputDisabled = function (id) {
        var rec = getTypeRecord(id);
        return rec == null || !(rec.state & RecordClientState.Edit || rec.state & RecordClientState.New);
    }

    $scope.isTypeStandardInputDisabled = function (id) {
        var rec = getTypeRecord(id);
        return rec == null || !rec.state & RecordClientState.Edit;
    }


    $scope.isTypeEditAllowed = function (id) {
        var isEditnow = $scope.types.some(el => el.id != id && el.state & RecordClientState.Edit);
        return !isEditnow;
    }

    $scope.isItemEditAllowed = function (id) {

        var isEditnow = $scope.items.some(el => el.id != id && el.state & RecordClientState.Edit);
        return !isEditnow;
    }

    $scope.isItemSaveAllowed = function (id) {

        var rec = getItemRecord(id);
        if (rec == null) {
            return false;
        }
        if (rec.name.trim().length == 0) {
            return false;
        }
        return true;
    }


    $scope.isTypeEditable = function (id) {
        var item = getTypeRecord(id);
        return item != null && (item.state == RecordClientState.Default || item.state & RecordClientState.JustAdded);
    }

    $scope.isItemEditable = function (id) {

        var item = getItemRecord(id);
        return item != null && (item.state == RecordClientState.Default || item.state & RecordClientState.JustAdded);
    }


    $scope.onEditTypeRecord = function (id) {

        console.log("Edit TYPE rec :" + id);
        var item = getTypeRecord(id);
        if (!item) return;

        item.state = RecordClientState.Edit;
        storeValues(id, ["tname"]);

        var ctrl = "#tname" + id;

        waitForElementToDisplay(ctrl, 200, function () {
            $(ctrl).focus();
            $(ctrl).attr("placeholder", "Enter name here");
        });

        return false;
    }

    $scope.onEditItemRecord = function (id) {

        console.log("Edit ITEM rec :" + id);
        var item = getItemRecord(id);
        if (!item) return false;

        item.state = RecordClientState.Edit;

        storeValues(id, ["name"]);

        var ctrl = "#name" + id;
        waitForElementToDisplay(ctrl, 200, function () {
            $(ctrl).focus();
            $(ctrl).attr("placeholder", "Enter name here");
        });

        return false;
    }


    $scope.onSaveTypeRecord = function (id) {

        clearMessages();

        console.log("Save type rec :" + id);
        var inputName = "#tname" + id;
        var name = $(inputName).val();
        console.log("name= " + name);

        var item = getTypeRecord(id);
        if (item == null) {
            return;
        }

        if (!checkTypeName(item.name)){
            doAlert("Type mame is wrong (should be at least 3 symbols)");
            return;
        }

        //if (!checkUniqueTypeRecord(item, item.state == RecordClientState.New)){

        if (!checkUniqueTypeRecord(item)){
            doAlert("Type '" + item.name + "' already exists!");
            return;
        }

        try {

            setLoading();

            if (item.state & RecordClientState.New) {

                assetsService.createType(item).then(function (result) {
                    try {
                        var res = result;
                        clearMessages();

                        if (!res) {
                            $scope.error = Errors.TYPE_QUERY_ERROR;
                            $scope.errorMessage = Errors.TYPE_QUERY_ERROR + ": " + name;

                            console.log("No result");
                            return;
                        }

                        if (res.status == Status.Error) {
                            console.log("Error, type not saved: " + name);
                            $scope.error = Errors.TYPE_NOT_SAVED;
                            $scope.errorMessage = res.message ? res.message : (Errors.TYPE_NOT_SAVED + ": " + name);
                            return;
                        }

                        $scope.addedTypeName = item.name;
                        $scope.updateClientRecords();
                        $scope.statusMessage = item.name + " : " + Status.Saved;

                    } finally {
                        stopLoading();
                    }


                }, function (error) {
                    console.log("TYPE record not saved");
                    $scope.error = Errors.TYPE_NOT_SAVED;
                    $scope.errorMessage = error && error.message ? error.message : Errors.TYPE_NOT_SAVED;
                    stopLoading();
                });

            } else if (item.state & RecordClientState.Edit) {

                assetsService.updateType(item).then(function (result) {
                        try {
                            var res = result;
                            //$(inputName).prop('disabled', true);
                            if (!res) {
                                console.log("No result");
                                return;
                            }
                            if (res.status == Status.Error) {
                                console.log("Error, type record not updated: " + name);
                                $scope.error = Errors.TYPE_NOT_UPDATED;
                                $scope.errorMessage = res.message ? res.message :
                                    (Errors.TYPE_NOT_UPDATED + ": " + name);
                                restoreCursor();
                                return;
                            }
                            $scope.updateClientRecords();
                            $scope.statusMessage = item.name + " : " + Status.Updated;
                            console.log("Update result = " + res);

                        } finally {
                            stopLoading();
                        }


                    },

                    function (error) {

                        console.log("Type record not saved : " + item.name);
                        $scope.error = Errors.TYPE_NOT_SAVED;
                        $scope.errorMessage = Errors.TYPE_NOT_SAVED + " : " + (error && error.message ? error.message : "");
                        stopLoading();
                    }
                );

            }

        } finally {

        }
    }

    $scope.onSaveItemApproveStatus = function (id) {

        var item = getItemRecord(id);
        if (item == null) {
            return;
        }
        item.needApprove = !item.needApprove;
///////////////
        setLoading();
        assetsService.updateItem(item).then(function (result) {
                try {
                    var res = result;
                    //$(inputName).prop('disabled', true);
                    if (!res) {
                        console.log("No result");
                        return;
                    }
                    if (res.status == Status.Error) {
                        console.log("Error, item record not updated: " + name);
                        $scope.error = Errors.ITEM_NOT_UPDATED;
                        $scope.errorMessage = res.message ? res.message :
                            (Errors.ITEM_NOT_UPDATED + ": " + name);
                        restoreCursor();
                        return;
                    }
                    $scope.updateClientRecords();
                    setSelectedType($scope.idSelectedType);
                    $scope.statusMessage = item.name + " : " + Status.Updated;
                    console.log("Update result = " + res);

                } finally {
                    stopLoading();
                }


            },

            function (error) {

                console.log("Item record not saved : " + item.name);
                $scope.error = Errors.ITEM_NOT_SAVED;
                $scope.errorMessage = Errors.ITEM_NOT_SAVED + " : " + (error && error.message ? error.message : "");
                stopLoading();
            }
        );
////
    }

    $scope.onTypeSelect = function(id){
        clearMessages();
        setSelectedType(id);
    }

    $scope.onSaveItemRecord = function (id) {

        clearMessages();
        console.log("Save item rec :" + id);
        var inputName = "#name" + id;

        var item = getItemRecord(id);
        if (item == null) {
            return;
        }

        if (!checkItemName(item.name)){
            doAlert("Item mame is wrong (should be at least 3 symbols)");
            return;
        }

        if (!checkUniqueItemRecord(item)){
            doAlert("Item '" + item.name + "' already exists!");
            return;
        }

        try {

            setWaitCursor();

            if (item.state & RecordClientState.New) {

                assetsService.createItem(item).then(function (result) {

                    try {

                        var res = result;

                        clearMessages();

                        if (!res) {
                            $scope.error = Errors.ITEM_NOT_SAVED;
                            $scope.errorMessage = Errors.ITEM_NOT_SAVED + ": " + name;

                            console.log("No result");
                            return;
                        }

                        if (res.status == Status.Error) {
                            console.log("Error, item not saved: " + name);
                            $scope.error = Errors.ITEM_NOT_SAVED;
                            $scope.errorMessage = res.message ? res.message : (Errors.ITEM_NOT_SAVED + ": " + name);
                            return;
                        }

                        $scope.addedItemName = item.name;
                        $scope.updateClientRecords();

                        setSelectedType($scope.idSelectedType);

                        $scope.statusMessage = item.name + " : " + Status.Saved;

                    } finally {
                        restoreCursor();
                    }


                }, function (error) {
                    console.log("Item record not saved");
                    $scope.error = Errors.ITEM_NOT_SAVED;
                    $scope.errorMessage = error && error.message ? error.message : Errors.ITEM_NOT_SAVED;
                    restoreCursor();
                });

            } else if (item.state & RecordClientState.Edit) {

                assetsService.updateItem(item).then(function (result) {
                        try {
                            var res = result;
                            //$(inputName).prop('disabled', true);
                            if (!res) {
                                console.log("No result");
                                return;
                            }
                            if (res.status == Status.Error) {
                                console.log("Error, item record not updated: " + name);
                                $scope.error = Errors.ITEM_NOT_UPDATED;
                                $scope.errorMessage = res.message ? res.message :
                                    (Errors.ITEM_NOT_UPDATED + ": " + name);
                                restoreCursor();
                                return;
                            }
                            $scope.updateClientRecords();
                            setSelectedType($scope.idSelectedType);

                            $scope.statusMessage = item.name + " : " + Status.Updated;
                            console.log("Update result = " + res);

                        } finally {
                            restoreCursor();
                        }


                    },

                    function (error) {

                        console.log("Item record not saved : " + item.name);
                        $scope.error = Errors.ITEM_NOT_SAVED;
                        $scope.errorMessage = Errors.ITEM_NOT_SAVED + " : " + (error && error.message ? error.message : "");
                        restoreCursor();
                    }
                );

            }

        } finally {

        }
    }

    $scope.isItemNewAllowed = function () {

        if ($scope.idSelectedType == null) return false;

        var res = findNewItemRecord();
        return res == null;

    }

    $scope.isTypeNewAllowed = function () {

        if ($scope.types.length == 0) {
            return true;
        }
//        if (!isAdminUser()) {
//            return false;
//        }
        var res = findNewTypeRecord();
        return res == null;
    }

    var storeValues = function (id, names) {
        if (!names) return;

        names.forEach(function (name) {
            try {

                var ctrl = "#" + name + id;
                $(ctrl).data('oldval', $(ctrl).val());

            } catch (e) {
                console.log("err" + e.message);
            }
        });
    }


    $scope.updateClientRecords = function () {

        $scope.items = [];
        $scope.types = [];
        return $scope.getData();
    }


    $scope.getSettings = function () {

        console.log("getting settings");
        var defer = $q.defer();
        assetsService.getSettings().then(function (result) {

            $scope.settings = result;
            var managers = null;

            $scope.supportEmails.set(COUNTRIES.EE, result.support_ee);
            $scope.supportEmails.set(COUNTRIES.SE, result.support_se);
            $scope.supportEmails.set(COUNTRIES.LV, result.support_lv);
            $scope.supportEmails.set(COUNTRIES.FI, result.support_fi);
            $scope.supportEmails.set(COUNTRIES.RU, result.support_ru);
            $scope.supportEmails.set(COUNTRIES.GE, result.support_ge);

            if (result.managers) {

                managers = result.managers;

                $.each(managers, function (ind, rec) {
                    var name = rec.name;
                    var jiraName = rec.jiraName;
                    var country = rec.country;

                    $scope.allManagers.push({
                        name: name,
                        jiraName: jiraName,
                        fullName: rec,
                        country: country,
                        id: ++ind
                    })
                })
            }
            defer.resolve(result);
        });

        return defer.promise;

    };


    $scope.getData = function () {

        var res;
        var defer = $q.defer();
        assetsService.getTypes().then(function (result) {
            res = result;
            var records = result;
            if (!records) {
                console.log("No item records");
            }

            $scope.types = $scope.types.concat(records);

            $.each($scope.types, function (ind, rec) {
                rec.id = ++ind;
                rec.state = RecordClientState.Default;
            })


            var rec = getTypeRecordByName($scope.addedTypeName);
            if (rec) {
                rec.state |= RecordClientState.JustAdded;
            }

            defer.resolve(result);

        }, function (error) {
            defer.reject(error);
            console.log("Error getting item types");
            $scope.error = Errors.CANNOT_GET_TYPE_RECORDS;
            $scope.errorMessage = error && error.message ? error.message : Errors.CANNOT_GET_TYPE_RECORDS;

        })
        return defer.promise;
    };


    $scope.changeTab = function (tab) {

        clearMessages();

        if (tab == "orders") {

            if ($scope.orderResult != null) {
                clearPrepareOrderPage();
            }
        }
        $scope.view_tab = tab;
    };

    $scope.onLostEditFocus = function (id) {
        var inputName = "#name" + id;
        $(inputName).prop('disabled', true);
    };


    var getCountryFromAuthUser = function () {
        if (!$scope.authUser) {
            return null;
        }
        var isEst = $scope.authUser.companyCodes.some(el => el.startsWith(COUNTRIES.EE));
        var isSwed = $scope.authUser.companyCodes.some(el => el.startsWith(COUNTRIES.SE));
        var isLat = $scope.authUser.companyCodes.some(el => el.startsWith(COUNTRIES.LV));
        var isFi = $scope.authUser.companyCodes.some(el => el.startsWith(COUNTRIES.FI));
        var isRu = $scope.authUser.companyCodes.some(el => el.startsWith(COUNTRIES.RU));
        var isGe = $scope.authUser.companyCodes.some(el => el.startsWith(COUNTRIES.GE));

        if (isEst && !isSwed && !isLat && !isFi && !isRu && !isGe) return  COUNTRIES.EE;
        if (isSwed && !isEst && !isLat && !isFi && !isRu && !isGe) return  COUNTRIES.SE;
        if (isLat && !isEst && !isFi && !isSwed && !isRu && !isGe) return  COUNTRIES.LV;
        if (isFi && !isEst && !isLat && !isSwed && !isRu && !isGe) return  COUNTRIES.FI;
        if (isRu && !isEst && !isLat && !isSwed && !isFi && !isGe) return  COUNTRIES.RU;
        if (isGe && !isEst && !isLat && !isSwed && !isRu && !isFi) return  COUNTRIES.GE;
        return null;

    }

    var restoreOldValues = function (name, id) {
        var inputName = "#" + name + id;
        var oldval = $(inputName).data("oldval");
        return "item." + name + "=unescape('" + escape(oldval) + "')";
    }

    $(document).on('focusin', 'input', function () {
        console.log("Saving value " + $(this).val());
        if ($(this).data('oldval') != null) {
            return;
        }
        $(this).data('oldval', $(this).val());
    })


    $scope.onCancelTypeEdit = function (id) {
        console.log("on escape: " + this);
        var item = getTypeRecord(id)
        if (!item) return;
        if (item.state & RecordClientState.New) {
            removeNewTypeRecord();
        } else {
            item.state = RecordClientState.Default;
            onCancelEditTypeField(id, "tname");
        }
    }

    $scope.onCancelItemEdit = function (id, name) {
        console.log("on cancel item edit: " + id);
        try {
            var item = getItemRecord(id)
            if (!item) {
                return;
            }
            if (item.state & RecordClientState.New) {
                removeNewItemRecord();
            } else {
                item.state = RecordClientState.Default;
                if (name) {
                    eval(restoreOldValues(name, id));
                    onCancelEditItemField(id, name);


                } else {
                    var elem = document.activeElement;
                    if (elem) {
                        onCancelEditItemField(id, "name");
                    } else {
                        eval(restoreOldValues("name", id));
                        eval(restoreOldValues("description", id));

                        onCancelEditItemField(id, "name");
                        onCancelEditItemField(id, "description");
                    }
                }


            }

        } finally {
            restoreCursor();
        }
    }

    $scope.isMainMenu = false;

    /*$scope.getRecords();*/

    $(".panel-top").resizable({
        handleSelector: ".splitter",
        resizeWidth: false
    });

    function dynamicSort(property) {
        var sortOrder = 1;

        if (property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a, b) {
            var result;

            if (!a[property] && !b[property]) {
                result = 0;
            }
            else if (!a[property]) {
                result = -1;
            }
            else if (!b[property])
                result = 1;
            else {
                result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            }

            return result * sortOrder;
        }
    }

    function getItemRecord(id) {
        if (!$scope.items) return null;
        var res = $scope.items.filter(el => el.id == id
    )
        ;
        return res.length > 0 ? res[0] : null;
    }

    var getOrderItemRecord = function (id) {
        if (!$scope.orderItems) return null;
        var res = $scope.orderItems.filter(el => el.id == id
        )
        ;
        return res.length > 0 ? res[0] : null;
    }


    var getOrderItem = function (id) {
        if (!$scope.order) return null;
        var res = $scope.order.filter(el => el.id == id
        )
        ;
        return res.length > 0 ? res[0] : null;
    }


    function getTypeRecord(id) {
        if (!$scope.types) return null;
        var res = $scope.types.filter(el => el.id == id
    )
        ;
        return res.length > 0 ? res[0] : null;

    }


    /*
     var getTypeRecord = function (id) {

     var rec = null;
     if (!$scope.types) return null;

     for (var i = 0; i < $scope.types.length; i++) {
     var r = $scope.types[i];
     if (r.id == id) {
     rec = r;
     break;
     }
     }

     return rec;
     }
     */


    function getItemMaxRecordId() {
        var res = 0;
        for (var i = 0; i < $scope.items.length; i++) {
            var rec = $scope.items[i];
            res = Math.max(rec.id, res);
        }
        return res;
    }

    function getTypeMaxRecordId() {
        var res = 0;
        for (var i = 0; i < $scope.types.length; i++) {
            var rec = $scope.types[i];
            res = Math.max(rec.id, res);
        }
        return res;
    }


    function doConfirm(msg, yesFn, noFn) {
        var confirmBox = $("#confirmBox");
        confirmBox.find(".message").html(msg);
        confirmBox.find(".yes,.no").unbind().click(function () {
            confirmBox.hide();
        });
        confirmBox.find(".yes").click(yesFn);
        confirmBox.find(".no").click(noFn);
        confirmBox.show();
    }

    function doAlert(msg) {
        var confirmBox = $("#alertBox");
        confirmBox.find(".message").text(msg);
        confirmBox.find(".yes").unbind().click(function () {
            confirmBox.hide();
        });
        confirmBox.find(".yes").click(function(){
        });
        confirmBox.show();
    }

    var adjustTypePositionForAddition = function () {

        while ($scope.startTypeIndex < $scope.types.length - $scope.show.typeNumber) {
            $scope.startTypeIndex += $scope.show.typeNumber;
        }
    };

    var adjustItemPositionForAddition = function () {

        while ($scope.startItemIndex < $scope.items.length - $scope.show.itemNumber) {
            $scope.startItemIndex += $scope.show.itemNumber;
        }
    };


    var onCancelEditTypeField = function (id, name) {

        var item = getTypeRecord(id)
        if (!item) return;
        var inputName = "#" + name + id;
        var oldval = $(inputName).data("oldval")
        console.log("setting old val to : " + inputName + " : " + oldval);
        $(inputName).blur();
        $(inputName).val(oldval);
        $(inputName).data('oldval', null);
        $(inputName).attr("placeholder", null);
        item.name = oldval;
        item.state = RecordClientState.Default;

    };

    var onCancelEditItemField = function (id, name) {
        var item = getItemRecord(id)
        if (!item) return;
        var inputName = "#" + name + id;
        var oldval = $(inputName).data("oldval")
        $(inputName).blur();
        $(inputName).val(oldval);
        $(inputName).data('oldval', null);
        $(inputName).attr("placeholder", null);
        item.state = RecordClientState.Default;
    };




    function statusCtrl($scope, $sce) {
        $scope.html = $sce.trustAsHtml('&#9989;');
    }

    function scrollIntoView(element, container) {
        var containerTop = $(container).scrollTop();
        var containerBottom = containerTop + $(container).height();
        var elemTop = element.offsetTop;
        var elemBottom = elemTop + $(element).height();
        if (elemTop < containerTop) {
            $(container).scrollTop(elemTop);
        } else if (elemBottom > containerBottom) {
            $(container).scrollTop(elemBottom - $(container).height());
        }
    }

    function random(min, max) {
        var rand = min + Math.random() * (max + 1 - min);
        rand = Math.floor(rand);
        return rand;
    };


    function enableControlsBySelector(name, val) {

        var elements = document.querySelectorAll(name);
        if (!elements) return;

        for (var i = 0; i < elements.length; i++) {
            elements[i].disabled = !val;
        }
    }


    var findNewTypeRecordIndex = function () {
        var res = -1;
        for (var i = 0; i < $scope.types.length; i++) {
            var rec = $scope.types[i];
            if (rec.state & RecordClientState.New) {
                res = i;
                break;
            }
        }
        return res;
    }

    var isAdminUser = function () {
        //// ***** DISABLE SECIRITY *****
        //return true;
        //// ***** DISABLE SECIRITY *****

        if (!$scope.authUser) {
            return false;
        }
        if (!$scope.authUser.authorities) {
            return false;
        }
        var admin = $scope.authUser.authorities.filter(function (elem, i, array) {
            //// ***** FOR TEST ONLY *****
                //return array[i].authority === 'ROLE_ADMIN_TEST';
                //return array[i].authority === 'ROLE_USER';
            //// ***** FOR TEST ONLY *****

            return array[i].authority === 'ROLE_ADMIN';

            }
        );

        return (admin && admin.length != 0);
    }

    var removeNewTypeRecord = function () {
        var index = findNewTypeRecordIndex();
        if (index >= 0) {
            console.log("removing new item at " + index);
            $scope.types.splice(index, 1);
        }
    }

    var removeNewItemRecord = function () {
        var index = findNewItemRecordIndex();
        if (index >= 0) {
            console.log("removing new item at " + index);
            $scope.items.splice(index, 1);
        }
    }

    var prepareOrderPage = function () {
        if ($scope.view_tab != "orders") return false;
        return true;
    }

    var getSupportEmail = function (country) {

        if (!country) return null;
        return $scope.supportEmails ? $scope.supportEmails.get(country) : null;

    }


    var setSelectedType = function (typeId) {

        $scope.idSelectedType = typeId;

        if (!typeId) {
            return;
        }

        var defer = $q.defer();

        $scope.items = [];
        setLoading();
        assetsService.getTypeItems(typeId).then(function (result) {

            var records = result;

            if (!records) {
                console.log("No item records");
            }
            $scope.items = $scope.items.concat(records);

            $.each($scope.items, function (ind, rec) {
                rec.id = ++ind;
                rec.state = RecordClientState.Default;
            })

            if ($scope.addedItemName){
                var newItemr = getItemRecordByName($scope.addedItemName);
                if (newItemr) {
                    newItemr.state |= RecordClientState.JustAdded;
                }
            }

            defer.resolve(result);
            stopLoading();

        }, function (error) {
            defer.reject(error);
            console.log("Error getting item records ");
            $scope.error = Errors.CANNOT_GET_ITEM_RECORDS;
            $scope.errorMessage = error && error.message ? error.message : Errors.CANNOT_GET_ITEM_RECORDS;
            stopLoading();

        })

    }

    function checkUniqueTypetRecordByName(id, name) {
        var res = true;
        for (var i = 0; i < $scope.types.length; i++) {
            var rec = $scope.types[i];
            if (id != rec.id && rec.name.toLowerCase() == name.toLowerCase()) {
                res = false;
                break;
            }
        }
        return res;
    }

    var showBasketNotification = function(){

        $("div#basketnotification").css("display", "block");

        setTimeout(function () {
            $("div#basketnotification").css("display", "none");
        }, 6000);

    }

    $scope.inputDelay = (function () {
        var promise = null;
        return function (callback, ms) {
            $timeout.cancel(promise); //clearTimeout(timer);
            promise = $timeout(callback, ms); //timer = setTimeout(callback, ms);
        };
    })();

    console.log("getting settings...");
    $scope.getSettings().then(function (res) {

        console.log("getting data...");

        $scope.getData().then(function (res) {

            console.log("Got records : " + res);
            assetsService.getAuthUser().then(function (result) {

                    $scope.authUser = result;
                    console.log("Authenticated user = " + $scope.authUser.username);
                    var country = getCountryFromAuthUser();

                    if (country){
                        $scope.chooseCountry(country);
                    }

                    $scope.isMainMenu = isAdminUser();

                }, function (error) {
                    console.log("Error getting authenticated user");
                }
            );
        });
    });


    $("#typerecords tr").click(function () {
        $(this).addClass('selected').siblings().removeClass('selected');
    });

    $scope.onselect = function () {
        console.log("select");

    }


    $scope.disabledCountry = function () {

        if (!$scope.country) return false;
        return $scope.order.length != 0 && !$scope.orderResult
    }

    $scope.chooseCountry = function (id) {

        $scope.country = id;

        if ($scope.orderResult){
            clearPrepareOrderPage();
        }
        $scope.managers = getManagersByCountry(id);

        clearMessages();

        setLoading();

        setTimeout(function () {
            stopLoading();
        }, 500);

        $("#order_itemtypes").css("display", "block");

        $scope.supportEmail = getSupportEmail(id);

        $scope.orderItemId = null;
        $scope.orderTypeId = null;
        $scope.makeOrder = true;

        return true;
    }


    $scope.setSelectedItem = function (itemId) {

        $scope.idSelectedItem = itemId;
    }


    $scope.placeBasketDisabled = function () {

        if ($scope.orderItemId == null) return true;
        if ($scope.orderResult) return true;

        var item = getOrderItemRecord($scope.orderItemId);
        if (!item) {
            return true;
        }
        return item.needApprove && !$scope.itemManager;

    }

    $scope.goOrderDisabled = function () {
        if ($scope.order == null) return true;
        return $scope.order.length == 0;
    }

    $scope.goOrderShow = function () {
        if (!prepareOrderPage()) return false;
        return $scope.country != null;
    }

    $scope.showApprovalNotification = function () {
        if ($scope.orderItemId == null) return false;
        var item = getOrderItemRecord($scope.orderItemId);
        if (!item) return false;
        return item.needApprove;
    }


    $scope.onAddNewItem = function () {

        clearMessages();
        setLoading();

        setTimeout(function () {
            stopLoading();
        }, 500);

        $("#order_itemtypes").css("display", "block");

        $scope.orderItemId = null;
        $scope.orderTypeId = null;
        $scope.makeOrder = true;
    }

    $scope.isCreateOrder = function () {
        if (!prepareOrderPage()) return false;
        if ($scope.country == null) return false;
        if (!$scope.order) return false;
        //return ($scope.order.length != 0)
        return true;
    }

    $scope.isShowAddItem = function () {
        if (!prepareOrderPage()) return false;
        if ($scope.country == null) return false;
        if ($scope.makeOrder) return false;
        //if (!$scope.order || $scope.order.length == 0) return false;

        //if ($scope.orderResult) return false;
        return true;
    }



    $scope.onAddToOrder = function () {

        if ($scope.orderItemId == null) return;
        if ($scope.typerecord == null) {
            $scope.typerecord = getTypeRecord($scope.orderTypeId);
        }
        if (!$scope.typerecord) return;

        var item = getOrderItemRecord($scope.orderItemId);
        if (!item) return;

        var ordertitem = getOrderItem(item.storageId);

        setLoading();

        if (ordertitem) {
            ordertitem.amount++;
        } else {
            $scope.order.push({
                typename: $scope.typerecord.name,
                id: item.storageId,
                name: item.name,
                description: item.description,
                manager: $scope.itemManager,
                amount: 1
            })
        }

        stopLoading();
        showBasketNotification();

    }

    $scope.onSelectOrderItem = function (item) {
        if (!item) return;
        $scope.orderItemId = item.id;
        if ($scope.orderItemId == null) return;
        $scope.itemManager = null;
        console.log("item = " + $scope.orderItemId);

        $("#itemDesc").html("");
        var itemDesc = !item.description ? "" : item.description;
        $("#itemDesc").html(itemDesc);
    }

    $scope.onAddOrderItem = function () {
        console.log("2click add item = " + $scope.orderItemId);
    }


    $scope.isShowCountries = function () {
        //if (!prepareOrderPage()) return false;
        return true;
        //return $scope.country == null;
    }

    $scope.isShowTypes = function () {
        if (!prepareOrderPage()) return false;
        if ($scope.country == null) return false;
        return $scope.makeOrder;
    }

    // $scope.isShowBasket = function () {
    //     if (!prepareOrderPage()) return false;
    //     return $scope.basket != null && $scope.basket.length > 0;
    // }

    $scope.isShowItems = function () {
        if (!prepareOrderPage()) return false;
        if ($scope.country == null) return false;
        return $scope.makeOrder;
    }


    $scope.orderPage = function () {
        if ($scope.view_tab != "orders") return false;
        return $scope.order && $scope.order.length != 0;
    }

    var clearPrepareOrderPage = function () {
        $scope.orderTypeId = null;
        $scope.orderItemId = null;
        $scope.order = [];
        $scope.typerecord = null;
        $scope.orderResult = null;
    }

    var clearOrderPage = function () {
        $scope.order = [];

    }

    $scope.onCreateOrder = function () {
        console.log("create order");
        $scope.order.result = null;
        $scope.createOrder();
    }

    $scope.createOrderDisabled = function () {

        if (!$scope.order || $scope.order.length == 0) return true;

        if ($scope.orderResult && $scope.orderResult.ticketId != null) return true;

        var badAmount = $scope.order.filter(el => isNaN(el.amount) || el.amount < 1) ;
        if (badAmount && badAmount.length > 0) return true;

        return false;
    }

    $scope.onSelectOrderType = function (item) {

        $scope.orderTypeId = item.id;

        var defer = $q.defer();
        console.log("type = " + $scope.orderTypeId);
        $scope.typerecord = getTypeRecord($scope.orderTypeId);
        $scope.orderItemId = null;
        $scope.orderItems = [];
        $("#itemDesc").html("");

        //setLoading();

        assetsService.getTypeItems($scope.typerecord.storageId).then(function (result) {

            var records = result;

            if (!records) {
                console.log("No item records");
            }

            $scope.orderItems = $scope.orderItems.concat(records);

            $.each($scope.orderItems, function (ind, rec) {
                rec.id = ++ind;
            })

            if ($scope.orderItems.length > 0) {
                $scope.orderItemId = $scope.orderItems[0].id;
                $scope.onSelectOrderItem(getOrderItemRecord($scope.orderItemId));
            }

            defer.resolve(result);
            //stopLoading();

        }, function (error) {
            //stopLoading();
            defer.reject(error);
            console.log("Error getting item records ");
            $scope.error = Errors.CANNOT_GET_ITEM_RECORDS;
            $scope.errorMessage = error && error.message ? error.message : Errors.CANNOT_GET_ITEM_RECORDS;

        })
        return;

    }

    var getManagerName = function(name){

        if (name == null || name.length == 0) {
            return "";
        }
        var ind = name.indexOf("#");
        return ind >=0 ? name.substring(0,  ind) : "" ;
    }

    var getManagerJiraName = function(name){

        if (name == null || name.length == 0) {
            return "";
        }
        var ind = name.indexOf("#");

        return ind >=0 ? name.substring(ind+1) : "" ;
    }

    var buildJiraTicketDescription = function () {

        var res = "";
        var body = "";
        if ($scope.order.length == 0) {
            return "";
        }

        var header = "|Type||Item||Amount||Comments|"
        $.each($scope.order, function (ind, rec) {
            if (body.length > 0) {
                body += "\n";
            }
            body += "|" + rec.typename + "|";
            body +=  "|" + rec.name + "|";
            body += "|" + rec.amount + "|";

            if (rec.manager) {
                body += "|Should be approved by " + getManagerNameByShortName(rec.manager) + "|";
            }else{
                body += "| |";
            }

        })

        res = header + "\n" + body;
        return res;
    }


    $scope.nameStyle = function (rec) {

        var style = null;
        if (rec == null) return style;

        if (rec.storageId != $scope.idSelectedType && rec.state & RecordClientState.JustAdded) {
            style = "color: darkGreen;";
        }
        return style;
    }

    $scope.itemStyle = function (rec) {

        var style = null;
        if (rec == null) return style;

        if (rec.storageId != $scope.idSelectedItem && (rec.state & RecordClientState.JustAdded)) {
            style = "color: darkGreen;";
        }

        return style;
    }

    $scope.orderManagers = function () {

        var res = "";
        if (!$scope.order) {
            return null;
        }
        if ($scope.order.length == 0) {
            return null;
        }

        $.each($scope.order, function (ind, rec) {
            if (rec.manager){

                var name = rec.manager;

                if (!name) return;

                if (res.length > 0) {
                    if (res.indexOf(name) != -1){
                        return;
                    }
                    res += ", ";
                }
                res += name;
            }
        })
        return res;
    }


    $scope.orderManagerNames = function () {

        var res = "";
        if (!$scope.order) {
            return null;
        }
        if ($scope.order.length == 0) {
            return null;
        }
        $.each($scope.order, function (ind, rec) {
            if (rec.manager){

                var name = getManagerNameByShortName(rec.manager);

                if (!name) return;

                if (res.length > 0) {
                    if (res.indexOf(name) != -1){
                        return;
                    }
                    res += ", ";
                }
                res += name;
            }
        })
        return res;
    }

    $scope.createOrder = function () {

        var res;
        var defer = $q.defer();
        clearMessages();

        var authdata = {
            username: $scope.settings.jiraUsername,
            password: $scope.settings.jiraPassword,
            jiraUri: $scope.settings.jiraUrl
        }

        var orderdata = {
            key: $scope.settings.jiraTicketKey,
            summary: $scope.settings.jiraTicketSummary,
            description: buildJiraTicketDescription(),
            name: $scope.settings.jiraTicketName,
            priority: $scope.settings.jiraTicketPriority,
            managers: $scope.orderManagers()
        };

        setLoading();

        setTimeout(jiraService.createTicket(orderdata).then(function (result) {
            stopLoading();
            $scope.orderResult = result;

            if (result.status == Status.Error){
                $scope.error = Errors.CREATE_ORDER_ERROR;
                $scope.errorMessage = result.message ? result.message : Errors.CREATE_ORDER_ERROR;
                return;
            }

            if (result.ticketId){
                $scope.orderResult.ticketLink = $scope.settings.jiraUrl + "/browse/" + result.ticketId;
            }

            //clearPrepareOrderPage();

        }, function (error) {
            //restoreCursor();
            stopLoading();
            defer.reject(error);
            console.log("Jira auhentication error");
            $scope.error = Errors.CREATE_ORDER_ERROR;
            $scope.errorMessage = Errors.CREATE_ORDER_ERROR;

        }), 500);
    }

    $(".itemfilter").on("keyup", function() {
        var value = $scope.itemFilter;
        if (value == null) return;
        value = value.toLocaleString();
        // remove all highlighted text passing all em tags
        $("#order_items tr").each(function(index) {

                var $row = $(this);
                var $tdElement = $row.find("td:first");
                var name = $tdElement.text().trim();
                var matchedIndex = name.toLocaleString().indexOf(value);

                if (matchedIndex >= 0) {

                    $row.show();
                }
                else {
                    //highlight matching text, passing element and matched text
//                    addHighlighting($tdElement, value);
                    $row.hide();
                }
        });
    });

    $(".typefilter").on("keyup", function() {
        var value = $scope.typefilter;
        if (value == null) return;
        value = value.toLowerCase();
        // remove all highlighted text passing all em tags
        $("#order_itemtypes tr").each(function(index) {

            var $row = $(this);
            var $tdElement = $row.find("td:first");
            var name = $tdElement.text().trim();
            var matchedIndex = name.toLowerCase().indexOf(value);

            if (matchedIndex >= 0) {
                $row.show();
            }
            else {
                $row.hide();
            }
        });
    });

    function removeHighlighting(highlightedElements){
        highlightedElements.each(function(){
            var element = $(this);
            element.replaceWith(element.html());
        })
    }

// add highlighting by wrapping the matched text into an em tag, replacing the current elements, html value with it
    function addHighlighting(element, textToHighlight){
        var text = element.text();
        var highlightedText = '<em>' + textToHighlight + '</em>';
        var newText = text.replace(textToHighlight, highlightedText);

        element.html(newText);
    }

    $scope.itemIncrease = function (item) {
        if (!item) return;

        if (item.amount>=0){
            item.amount++;
        }
    }

    $scope.itemDecrease = function (item) {

        if (!item) return;

        if (item.amount > 0){
            item.amount--;
        }
    }

    $scope.itemDecreaseDisabled = function (item) {
        return item && (isNaN(item.amount) || item.amount <= 1);
    }

    $scope.itemIncreaseDisabled = function (item) {
        return item && isNaN(item.amount) ;
    }

    $scope.onCloseBasketNotification = function () {

        console.log("close notification");

        $("div#basketnotification").css("display", "none");

    }

    $scope.orderSize = function () {

        var res = 0;

        $.each($scope.order, function (ind, rec) {

            if(rec.amount){
                res += rec.amount;
            }

        })
        return res;
    }

})
;