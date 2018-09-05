package com.tallink.ittel.dao.model.domain;

import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.List;

/**
 * Created by dmitrigu on 03.10.17.
 */
@Setter
@Getter
public class User implements Serializable{
    String name;
    List<String> groups;
}