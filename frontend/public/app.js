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

const DEFAULT_ALERT_DURATION = 3000;

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
            uppercase: false,
            reverse: false,
        };

        if (!data.text.trim().length) {
            this.showAlert("Please enter a fruit", { iconClass: "fa fa-exclamation-circle", alertTypeClass: "pf-c-alert pf-m-danger pf-m-inline", duration: DEFAULT_ALERT_DURATION });
            return;
        }

        let json = JSON.stringify(data);

        request.setRequestHeader("Content-Type", "application/json");
        request.send(json);

        form.text.value = "";
    }

    renderResponses() {
    }

    renderWorkers() {
        console.log("Rendering workers");
    }

    showNotificationByResponseStatus(responseStatus) {
        if (responseStatus >= 200 && responseStatus < 300) {
            this.showAlert("Fruit succesfully created", { iconClass: "fa fa-check-circle", alertTypeClass: "pf-c-alert pf-m-success pf-m-inline", duration: DEFAULT_ALERT_DURATION });
        } else {
            this.showAlert("An unexpected error occurred. Please try again later", { iconClass: "fa fa-exclamation-circle", alertTypeClass: "pf-c-alert pf-m-danger pf-m-inline", duration: DEFAULT_ALERT_DURATION });
        }
    }

    showAlert(message, options) {
        const alertTitle = document.getElementById("alertTitle");
        const alertIcon = document.getElementById("alertIcon");
        const alertMessage = document.getElementById("alertMessage");

        alertTitle.innerHTML = message;
        alertIcon.className = options.iconClass;
        alertMessage.className = options.alertTypeClass;

        alertMessage.removeAttribute("style");
        clearTimeout(this.alertTimeoutReference);
        this.alertTimeoutReference = setTimeout(() => {
            this.hideElement(alertMessage);
        }, options.duration);

                const closeAlertButton = document.getElementById("closeAlertButton");
        closeAlertButton.addEventListener("click", (event) => {
            this.hideElement(alertMessage);
        });
    }

    hideElement(element) {
        element.style.visibility = "hidden";
    }
}
