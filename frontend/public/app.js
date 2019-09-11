/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

"use strict";

const gesso = new Gesso();

class Application {
    constructor() {
        this.data = null;
        this.alertTimeoutReference = null;

        window.addEventListener("statechange", (event) => {
            this.renderResponses();
            this.renderWorkers();
        });

        window.addEventListener("load", (event) => {
            this.fetchDataPeriodically();

            $("#requests").addEventListener("submit", (event) => {
                this.sendRequest(event.target);
                this.fetchDataPeriodically();
            });
        });
    }

    fetchDataPeriodically() {
        gesso.fetchPeriodically("/api/data", (data) => {
            this.data = data;
            window.dispatchEvent(new Event("statechange"));
        });
    }

    sendRequest(form) {
        console.log("Sending request");

        let request = gesso.openRequest("POST", "/api/send-request", (event) => {
            if (event.target.status >= 200 && event.target.status < 300) {
                this.fetchDataPeriodically();
            }
            this.showNotificationByResponseStatus(event.target.status);
        });

        let data = {
            text: form.text.value,
            // stock: form.stock.value
            uppercase: false,
            reverse: false,
        };

        if (data.text.trim().length === 0) {
            this.setAlertMessageContent("Please enter a fruit", "fa fa-exclamation-circle", "pf-c-alert pf-m-danger pf-m-inline");
            this.showAlertForDuration(3000);
        } else {
            let json = JSON.stringify(data);

            request.setRequestHeader("Content-Type", "application/json");
            request.send(json);
    
            form.text.value = "";
            // form.stock.value = "";
        }
    }

    renderResponses() {
    }

    renderWorkers() {
        console.log("Rendering workers");
    }

    showNotificationByResponseStatus(responseStatus) {
        this.setCloseAlertOnClick();

        if (responseStatus>= 200 && responseStatus < 300) {
            this.setAlertMessageContent("Fruit succesfully created", "fa fa-check-circle", "pf-c-alert pf-m-success pf-m-inline");
        } else {
            this.setAlertMessageContent("An unexpected error occurred. Please try again later", "fa fa-exclamation-circle", "pf-c-alert pf-m-danger pf-m-inline");
        }

        this.showAlertForDuration(3000);
    }

    setCloseAlertOnClick() {
        const closeAlertButton = document.getElementById("closeAlertButton");
        closeAlertButton.addEventListener("click", (event) => {
            this.hideElement(alertMessage);
        });
    }

    setAlertMessageContent(title, iconClass, alertTypeClass) {
        const alertTitle = document.getElementById("alertTitle");
        const alertIcon = document.getElementById("alertIcon");
        const alertMessage = document.getElementById("alertMessage");

        alertTitle.innerHTML = title;
        alertIcon.className =  iconClass;
        alertMessage.className = alertTypeClass;
    }

    hideElement(element) {
        element.style.visibility = "hidden";
    }

    showAlertForDuration(duration) {
        const alertMessage = document.getElementById("alertMessage");
        alertMessage.removeAttribute("style"); 
        clearTimeout(this.alertTimeoutReference);
        this.alertTimeoutReference = setTimeout(() => {
            this.hideElement(alertMessage);
        }, duration);
    }
}
