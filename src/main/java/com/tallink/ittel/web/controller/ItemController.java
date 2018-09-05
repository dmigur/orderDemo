package com.tallink.ittel.web.controller;

import com.tallink.ittel.Constants;
import com.tallink.ittel.IttelStatus;
import com.tallink.ittel.ServiceNames;
import com.tallink.ittel.dao.model.domain.Item;
import com.tallink.ittel.dao.model.domain.ItemType;
import com.tallink.ittel.exceptions.IttelException;
import com.tallink.ittel.service.DefaultConfigService;
import com.tallink.ittel.service.ItemService;
import com.tallink.ittel.service.ItemTypeService;
import com.tallink.ittel.util.DateUtils;
import com.tallink.ittel.util.JsonUtils;
import com.tallink.ittel.util.SecurityUtil;
import com.tallink.ittel.web.api.*;
import org.apache.commons.collections.map.HashedMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import static com.tallink.ittel.Constants.name;
import static com.tallink.ittel.ServiceNames.DEFAULT_CONFIG_SERVICE;
import static org.bouncycastle.asn1.cms.CMSObjectIdentifiers.data;
import static org.springframework.http.HttpStatus.OK;
import static org.springframework.web.bind.annotation.RequestMethod.GET;
import static org.springframework.web.bind.annotation.RequestMethod.POST;


/**
 * Created by dmitrigu on 14.04.17.
 */

@Controller
public class ItemController extends BaseController {

    Logger LOG = LoggerFactory.getLogger(ItemController.class);

    @Autowired
    @Qualifier(ServiceNames.ITEM_SERVICE)
    private ItemService itemService;

    @Autowired
    @Qualifier(ServiceNames.ITEMTYPE_SERVICE)
    private ItemTypeService itemTypeService;

    @Autowired
    @Qualifier(DEFAULT_CONFIG_SERVICE)
    private DefaultConfigService defaultConfigService;


    @ResponseStatus(OK)
    @RequestMapping(value = "/api/items", method = GET)
    @ResponseBody
    public Collection<com.tallink.ittel.web.api.ItemData> getItems()
            throws IttelException {
        Collection<Item> records = null;
        Collection<ItemData> items = new ArrayList<ItemData>();
        try {
            records = itemService.getItems();
        } catch (Exception e) {

            LOG.error("Error getting items", e);

            throw new IttelException("Error getting items");
        }

        for (Item item : records) {
            ItemData itemData = new ItemData();
            itemData.setName(item.getName());
            ItemType itemType = item.getType();
            ItemTypeData itemTypeData = new ItemTypeData();
            itemTypeData.setName(itemType.getName());
            itemTypeData.setDescription(itemType.getDescription());
            itemTypeData.setStorageId(itemType.getId());
            itemData.setDescription(item.getDescription());
            itemData.setStorageId(item.getId());


            itemData.setItemType(itemTypeData);
            items.add(itemData);
        }

        return items;
    }


    @ResponseStatus(OK)
    @RequestMapping(value = "/api/items/{typeId}", method = GET)
    @ResponseBody
    public Collection<com.tallink.ittel.web.api.ItemData> getTypeItems(@PathVariable Integer typeId)
            throws IttelException {
        Collection<Item> records = null;
        Collection<ItemData> items = new ArrayList<ItemData>();
        try {
            records = itemService.getItemsByType(typeId);
        } catch (Exception e) {
            LOG.error("Error getting type, ID = " + typeId);
            throw new IttelException("Error getting type record ");
        }

        for (Item item : records) {
            ItemData itemData = new ItemData();
            itemData.setName(item.getName());
            ItemType itemType = item.getType();
            itemData.setNeedApprove(item.isNeedApprove());
            itemData.setDescription(item.getDescription());
            itemData.setStorageId(item.getId());

            ItemTypeData itemTypeData = new ItemTypeData();
            itemTypeData.setName(itemType.getName());
            itemTypeData.setDescription(itemType.getDescription());
            itemTypeData.setStorageId(itemType.getId());
            itemData.setItemType(itemTypeData);

            items.add(itemData);
        }

        return items;
    }


    @ResponseStatus(OK)
    @RequestMapping(value = "/api/types", method = GET)
    @ResponseBody
    public Collection<com.tallink.ittel.web.api.ItemTypeData> getTypes()
            throws IttelException {
        Collection<ItemType> records = null;
        Collection<ItemTypeData> items = new ArrayList<ItemTypeData>();

        try {
            records = itemTypeService.getTypes();
        } catch (Exception e) {

            LOG.error("Error getting types");
            throw new IttelException("Error getting types");
        }

        for (ItemType item : records) {
            ItemTypeData itemData = new ItemTypeData();
            itemData.setName(item.getName());
            itemData.setDescription(item.getDescription());
            itemData.setStorageId(item.getId());
            items.add(itemData);
        }

        return items;
    }


    @ResponseStatus(OK)
    @RequestMapping(value = "/api/createtype", method = POST)
    @ResponseBody
    public ItemTypeData createType(@RequestBody Map data) throws Exception {

        ItemTypeData resultData = new ItemTypeData();
        try {
            ItemType record = itemTypeService.saveItemType(data);
            if (record == null) {

                throw new IttelException("Error creating type");

            }
            resultData.setName(record.getName());
            resultData.setDescription(record.getDescription());
            resultData.setStorageId(record.getId());
            return resultData;

        } catch (Exception ex) {
            LOG.error("Error creating type: " + (String) data.get(name.name()));
            resultData.setMessage("Error creating Type record");
            throw new IttelException("Error creating Type record: ");
        }
    }

    @ResponseStatus(OK)
    @RequestMapping(value = "/api/createitem", method = POST)
    @ResponseBody
    public ItemData createItem(@RequestBody Map data) throws Exception {

        ItemData resultData = new ItemData();
        String name = (String)data.get(Constants.name.name());
        Integer typeId = (Integer) data.get(Constants.typeId.name());
        try {
            Item record = itemService.saveItem(data);

            if (record == null) {
                throw new IttelException("Error saving Item");
            }
            resultData.setName(record.getName());
            resultData.setDescription(record.getDescription());
            resultData.setStorageId(record.getId());

            return resultData;

        } catch (Exception ex) {
            LOG.error("Error creating item, name =" + name);
            resultData.setMessage("Error saving Type record");
            throw new IttelException("Error saving Type record: ");
        }
    }


    @ResponseStatus(OK)
    @RequestMapping(value = "/api/deletetype", method = POST)
    @ResponseBody
    public IttelResult deleteType(@RequestBody Map data) {

        IttelResult resultData = new IttelResult();
        Integer recordId = null;
        String name = null;
        try {
            recordId = (Integer) data.get(Constants.id.name());
            name = (String) data.get(Constants.name.name());
        } catch (Exception e) {
            LOG.error("Error, no data for deletion", e);
        }

        if (recordId == null) {
            resultData.setStatus(IttelStatus.Error);
            resultData.setMessage("Invalid record id");
            return resultData;
        }
        LOG.info("Deleting type= " + name);

        try {
            ItemType obj = new ItemType();
            obj.setId(recordId);
            obj.setName(name);

            itemTypeService.deleteRecord(obj);
            resultData.setStatus(IttelStatus.Ok);
        } catch (Exception ex) {
            resultData.setStatus(IttelStatus.Error);
            LOG.error("Error deleting type = " + name, ex);
            throw ex;
        }

        return resultData;
    }

    @ResponseStatus(OK)
    @RequestMapping(value = "/api/deleteitem", method = POST)
    @ResponseBody
    public IttelResult deleteItem(@RequestBody Map data) {

        IttelResult resultData = new IttelResult();
        Integer recordId = null;
        String name = null;
        try {
            recordId = (Integer) data.get(Constants.id.name());
            name = (String) data.get(Constants.name.name());
            LOG.info("Deleting item = " + name);
        } catch (Exception e) {
            LOG.error("Error deleting item " + name, e);
        }

        if (recordId == null) {
            resultData.setStatus(IttelStatus.Error);
            resultData.setMessage("Invalid record id");
            return resultData;
        }

        try {
            Item obj = new Item();
            obj.setId(recordId);
            obj.setName(name);

            itemService.deleteRecord(obj);
            resultData.setStatus(IttelStatus.Ok);
        } catch (Exception ex) {
            resultData.setStatus(IttelStatus.Error);
            LOG.error("Error deleting item = " + name, ex);
            throw ex;
        }

        return resultData;
    }


    @ResponseStatus(OK)
    @RequestMapping(value = "/api/updatetype", method = POST)
    @ResponseBody
    public IttelResult updateType(@RequestBody Map data) throws IttelException {

        IttelResult resultData = new IttelResult();

        try {

            itemTypeService.updateItemType(data);
            resultData.setStatus(IttelStatus.Ok);
            return resultData;

        } catch (Exception e) {
            Integer id = (Integer) data.get(Constants.storageId.name());
            LOG.error("Error updating type, ID =: " + id);
            resultData.setStatus(IttelStatus.Error);
            return resultData;

        }

    }

    @ResponseStatus(OK)
    @RequestMapping(value = "/api/updateitem", method = POST)
    @ResponseBody
    public IttelResult updateItem(@RequestBody Map data) throws IttelException {

        IttelResult resultData = new IttelResult();
        try {
            itemService.updateItem(data);

            resultData.setStatus(IttelStatus.Ok);
            return resultData;

        } catch (Exception e) {
            LOG.error("Error updating item, ID =" + (Integer) data.get(Constants.storageId.name()));
            resultData.setStatus(IttelStatus.Error);
            return resultData;

        }
    }


    @ResponseStatus(OK)
    @RequestMapping(value = "/api/settings", method = GET)
    @ResponseBody
    public DefaultSettings getDefaultSettings() {
        DefaultSettings settings = new DefaultSettings();
        settings.setSamlSecurityEnabled(defaultConfigService.isIttelSamlSecurityEnabled());

        settings.setJiraUrl(defaultConfigService.getJiraUrl());
        settings.setJiraAuthUri(defaultConfigService.getJiraAuthUri());
        settings.setJiraCreateUri(defaultConfigService.getJiraIssueUri());
        settings.setJiraPassword(defaultConfigService.getJiraPassword());
        settings.setJiraUsername(defaultConfigService.getJiraUsername());
        settings.setJiraTicketKey(defaultConfigService.getJiraTicketKey());
        settings.setJiraTicketName(defaultConfigService.getJiraTicketName());
        settings.setJiraTicketSummary(defaultConfigService.getJiraTicketSummary());
        settings.setJiraTicketPriority(defaultConfigService.getJiraTicketPriority());
        settings.setManagers(defaultConfigService.getManagers());

        settings.setSupport_ee(defaultConfigService.getSupport_ee());
        settings.setSupport_fi(defaultConfigService.getSupport_fi());
        settings.setSupport_lv(defaultConfigService.getSupport_lv());
        settings.setSupport_se(defaultConfigService.getSupport_se());
        settings.setSupport_ru(defaultConfigService.getSupport_ru());
        settings.setSupport_ge(defaultConfigService.getSupport_ge());

        return settings;
    }


    @ResponseStatus(OK)
    @RequestMapping(value = "/api/authuser", method = GET)
    @ResponseBody
    public UserData getAuthUser() {

        try {
            return SecurityUtil.getAuthUser();

        } catch (Exception e) {
            LOG.error("Error getting authenticated user");
        }
        return null;
    }

    @ResponseStatus(OK)
    @RequestMapping(value = "/api/jira/auth", method = POST)
    @ResponseBody
    public IttelResult authJiraUser(@RequestBody Map data) {

        IttelResult resultData = new IttelResult();

        String targetURL = "";
        Map jsondata = new HashedMap();

        targetURL = defaultConfigService.getJiraUrl();
        boolean success;
        try {

            Map res = itemService.sendJiraPost(targetURL, defaultConfigService.getJiraUsername(),
                    defaultConfigService.getJiraPassword(), JsonUtils.toJson(jsondata));

            if (res == null) {
                resultData.setStatus(IttelStatus.Error);
            } else {
                success = (res.get(Constants.logininfo.name()) != null);
                if (success) {
                    resultData.setStatus(IttelStatus.Ok);
                } else {
                    resultData.setStatus(IttelStatus.Error);
                }
                String session = (String) ((HashMap) res.get("session")).get("value");
                resultData.setMessage(session);
            }

        } catch (Exception e) {
            LOG.error("Error getting authenticated user");
            resultData.setStatus(IttelStatus.Error);
        }
        return resultData;
    }


    @ResponseStatus(OK)
    @RequestMapping(value = "/api/jira/create", method = POST)
    @ResponseBody
    public JiraTicketResult createJiraIssue(@RequestBody Map data) throws Exception{

        JiraTicketResult resultData = new JiraTicketResult();
        String targetURL = "";
        boolean success = false;
        targetURL = defaultConfigService.getJiraUrl() +
                defaultConfigService.getJiraIssueUri();

        Map createData = new HashMap();
        createData.put(Constants.fields.name(), data.get(Constants.fields.name()));

        Map res = null;
        try {

            res = itemService.sendJiraPost(targetURL, defaultConfigService.getJiraUsername(),
                    defaultConfigService.getJiraPassword(), JsonUtils.toJson(createData));

        } catch (Exception e) {
            LOG.error("Error creating JIRA ticket: " + e.getMessage(), e);
            resultData.setStatus(IttelStatus.Error);
            resultData.setMessage(e.getMessage());
            return resultData;
        }

        JiraTicketResult watchersResultData = new JiraTicketResult();
        if (res == null) {
            watchersResultData.setStatus(IttelStatus.Error);
        } else {
            success = (res.get(Constants.key.name()) != null);
            if (success) {
                resultData.setStatus(IttelStatus.Ok);
                String ticketId = (String) res.get(Constants.key.name());
                resultData.setTicketId(ticketId);
                addJiraWatchers(data, ticketId);
            } else {
                resultData.setStatus(IttelStatus.Error);
                String errorMessage = DateUtils.getJiraErrors((Map) res.get(Constants.errors.name()));
                resultData.setMessage(errorMessage);
            }
        }

        return resultData;
    }

    private JiraTicketResult addJiraWatchers(Map data, String ticketId) throws  Exception{

        JiraTicketResult resultData = new JiraTicketResult();
        String targetURL = defaultConfigService.getJiraUrl() + defaultConfigService.getJiraIssueUri() +
                "/" + ticketId + defaultConfigService.getJiraWatchersUri();

        Map jiraResult;
                String managers =  (String) data.get(Constants.managers.name());
        if (managers == null){
            resultData.setStatus(IttelStatus.Error);
            return resultData;
        }
        String watcher = "\"" + managers + "\"";

        jiraResult = itemService.sendJiraPost(targetURL, defaultConfigService.getJiraUsername(),
                defaultConfigService.getJiraPassword(), watcher);

        boolean success = jiraResult == null || (jiraResult.get(Constants.errors.name()) != null);

        if (success) {
            resultData.setStatus(IttelStatus.Ok);
        } else {
            resultData.setStatus(IttelStatus.Error);
            String errorMessage = DateUtils.getJiraErrors(jiraResult);
            resultData.setMessage(errorMessage);
        }

        return resultData;
    }


}
