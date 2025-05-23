/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.trino.plugin.hive;

import io.trino.spi.TrinoException;
import io.trino.spi.connector.SchemaTableName;

import static io.trino.spi.StandardErrorCode.ALREADY_EXISTS;
import static java.lang.String.format;

public class ViewAlreadyExistsException
        extends TrinoException
{
    public ViewAlreadyExistsException(SchemaTableName viewName)
    {
        super(ALREADY_EXISTS, format("View already exists: '%s'", viewName));
    }
}
