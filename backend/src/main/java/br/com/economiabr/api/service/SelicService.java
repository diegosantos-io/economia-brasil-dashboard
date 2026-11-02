
package br.com.economiabr.api.service;

import br.com.economiabr.api.client.BancoCentralClient;
import br.com.economiabr.api.dto.SelicResponse;

import tools.jackson.databind.JsonNode;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class SelicService {

    private final BancoCentralClient bancoCentralClient;

    private static final DateTimeFormatter FORMATO_ENTRADA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final DateTimeFormatter FORMATO_SAIDA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public SelicService(BancoCentralClient bancoCentralClient) {
        this.bancoCentralClient = bancoCentralClient;
    }

    public List<SelicResponse> buscarHistorico(int dias) {

        JsonNode resposta = bancoCentralClient.buscarSelic(dias);

        if (!resposta.isArray() || resposta.isEmpty()) {
            throw new IllegalStateException(
                    "O Banco Central não retornou dados para a Selic."
            );
        }

        List<SelicResponse> historico = new ArrayList<>();

        for (JsonNode registro : resposta) {

            String dataOriginal = registro.path("data").asText();
            String valorOriginal = registro.path("valor").asText();

            if (dataOriginal.isBlank() || valorOriginal.isBlank()) {
                continue;
            }

            LocalDate data = LocalDate.parse(
                    dataOriginal,
                    FORMATO_ENTRADA
            );

            double valor = Double.parseDouble(
                    valorOriginal.replace(",", ".")
            );

            historico.add(new SelicResponse(
                    dataOriginal,
                    data.format(FORMATO_SAIDA),
                    "Meta Selic",
                    valor,
                    "% a.a.",
                    "Banco Central do Brasil - SGS 432"
            ));
        }

        return historico;
    }
}
