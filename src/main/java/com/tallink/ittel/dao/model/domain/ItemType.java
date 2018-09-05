package com.tallink.ittel.dao.model.domain;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.FetchMode;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Calendar;
import java.util.Collection;
import java.util.List;
import java.util.Set;

import static com.tallink.ittel.DatabaseTableNames.ITTEL_ITEMTYPE;
import static javax.persistence.FetchType.EAGER;
import static javax.persistence.FetchType.LAZY;
import static javax.persistence.GenerationType.AUTO;
import static org.hibernate.annotations.CascadeType.MERGE;
import static org.hibernate.annotations.CascadeType.SAVE_UPDATE;
import static org.hibernate.annotations.CascadeType.DELETE;

/**
 * Created by dmitrigu on 14.04.17.
 */
@Entity
@Table(name = ITTEL_ITEMTYPE)
public class ItemType {

    @Id
    @GeneratedValue(strategy = AUTO)
    private Integer id;

    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;

    @OneToMany(mappedBy = "type", fetch = LAZY, orphanRemoval = true)
    @Cascade(value = {DELETE})
    private Set<Item> items;

    public Set<Item> getItems() {
        return items;
    }

    public void setItems(Set<Item> items) {
        this.items = items;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

/*    public Set<Item> getItems() {
        return items;
    }

    public void setItems(Set<Item> items) {

        this.items = items;
    }*/

}
