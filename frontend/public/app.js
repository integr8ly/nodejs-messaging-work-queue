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
        });

        let data = {
            text: form.text.value,
            stock: 0,
            uppercase: false,
            reverse: false,
        };

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
}
